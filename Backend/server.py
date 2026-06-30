from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, status
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr


# ──────────────────────────────────────────────────────────────────────────────
# Config / DB
# ──────────────────────────────────────────────────────────────────────────────
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_ALGORITHM = "HS256"
JWT_SECRET = os.environ["JWT_SECRET"]
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@probites.ng")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")
STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY", "sk_test_emergent")

app = FastAPI(title="ProBites Signature API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────
def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()

def verify_password(p: str, h: str) -> bool:
    try:
        return bcrypt.checkpw(p.encode(), h.encode())
    except Exception:
        return False

def create_access_token(uid: str, email: str) -> str:
    payload = {"sub": uid, "email": email, "type": "access",
               "exp": datetime.now(timezone.utc) + timedelta(hours=8)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(uid: str) -> str:
    payload = {"sub": uid, "type": "refresh",
               "exp": datetime.now(timezone.utc) + timedelta(days=7)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def set_auth_cookies(resp: Response, access: str, refresh: str):
    resp.set_cookie("access_token", access, httponly=True, secure=True, samesite="none",
                    max_age=60 * 60 * 8, path="/")
    resp.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="none",
                    max_age=60 * 60 * 24 * 7, path="/")

def clear_auth_cookies(resp: Response):
    resp.delete_cookie("access_token", path="/")
    resp.delete_cookie("refresh_token", path="/")

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user.pop("_id", None)
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user

def strip_id(doc: Optional[dict]) -> Optional[dict]:
    if doc is None:
        return None
    doc.pop("_id", None)
    return doc

# ──────────────────────────────────────────────────────────────────────────────
# Models
# ──────────────────────────────────────────────────────────────────────────────
class LoginIn(BaseModel):
    email: EmailStr
    password: str

class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    slug: str
    category: str  # Cake | Small Chops | Chinchin | Peanuts | Yoghurt | Cake Parfait | Fruit Parfait
    description: str = ""
    price: float
    currency: str = "NGN"
    image_url: str = ""
    available: bool = True
    featured: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ProductIn(BaseModel):
    name: str
    slug: Optional[str] = None
    category: str
    description: str = ""
    price: float
    currency: str = "NGN"
    image_url: str = ""
    available: bool = True
    featured: bool = False

class Testimonial(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    location: str = ""
    quote: str
    rating: int = 5
    image_url: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TestimonialIn(BaseModel):
    name: str
    location: str = ""
    quote: str
    rating: int = 5
    image_url: str = ""

class SiteContent(BaseModel):
    hero_eyebrow: str = "Premium Bites · Made in Abuja"
    hero_title: str = "Bites that speak class."
    hero_subtitle: str = "Handcrafted cakes, small chops, parfaits and signature snacks — delivered with love across Abuja."
    hero_cta: str = "Order Now"
    about_title: str = "Our Story"
    about_body: str = "ProBites Signature was born from a passion for premium taste and elegant presentation. Every bite is crafted to feel like a celebration."
    business_phone: str = "09039118382"
    business_address: str = "Diaspora Hospital, Behind Angua Burukutu, Kadokushi, Abuja."
    business_email: str = "hello@probites.ng"
    instagram: str = "probites.signature"
    facebook: str = "probites.signature"
    tagline: str = "premium bites, professional taste"

class CartItemIn(BaseModel):
    product_id: str
    quantity: int = 1

class CheckoutIn(BaseModel):
    items: List[CartItemIn]
    customer_name: str
    customer_phone: str
    customer_email: EmailStr
    customer_address: str
    origin_url: str

# ──────────────────────────────────────────────────────────────────────────────
# Auth endpoints
# ──────────────────────────────────────────────────────────────────────────────
@api.post("/auth/login")
async def login(body: LoginIn, response: Response):
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    access = create_access_token(user["id"], user["email"])
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    return {"id": user["id"], "email": user["email"], "name": user.get("name", ""), "role": user.get("role", "user")}

@api.post("/auth/logout")
async def logout(response: Response, _: dict = Depends(get_current_user)):
    clear_auth_cookies(response)
    return {"ok": True}

@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user

@api.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        access = create_access_token(user["id"], user["email"])
        response.set_cookie("access_token", access, httponly=True, secure=True,
                            samesite="none", max_age=60 * 60 * 8, path="/")
        return {"ok": True}
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

# ──────────────────────────────────────────────────────────────────────────────
# Products
# ──────────────────────────────────────────────────────────────────────────────
@api.get("/products")
async def list_products(category: Optional[str] = None, featured: Optional[bool] = None):
    q: Dict[str, Any] = {}
    if category:
        q["category"] = category
    if featured is not None:
        q["featured"] = featured
    docs = await db.products.find(q, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return docs

@api.get("/products/{product_id}")
async def get_product(product_id: str):
    doc = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    return doc

@api.post("/products")
async def create_product(body: ProductIn, _: dict = Depends(require_admin)):
    data = body.model_dump()
    if not data.get("slug"):
        data["slug"] = data["name"].lower().replace(" ", "-")
    prod = Product(**data)
    await db.products.insert_one(prod.model_dump())
    return strip_id(prod.model_dump())

@api.put("/products/{product_id}")
async def update_product(product_id: str, body: ProductIn, _: dict = Depends(require_admin)):
    data = body.model_dump()
    if not data.get("slug"):
        data["slug"] = data["name"].lower().replace(" ", "-")
    res = await db.products.update_one({"id": product_id}, {"$set": data})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    doc = await db.products.find_one({"id": product_id}, {"_id": 0})
    return doc

@api.delete("/products/{product_id}")
async def delete_product(product_id: str, _: dict = Depends(require_admin)):
    res = await db.products.delete_one({"id": product_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"ok": True}

@api.get("/categories")
async def list_categories():
    return ["Cake", "Small Chops", "Chinchin", "Peanuts", "Yoghurt", "Cake Parfait", "Fruit Parfait"]

# ──────────────────────────────────────────────────────────────────────────────
# Testimonials
# ──────────────────────────────────────────────────────────────────────────────
@api.get("/testimonials")
async def list_testimonials():
    docs = await db.testimonials.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return docs

@api.post("/testimonials")
async def create_testimonial(body: TestimonialIn, _: dict = Depends(require_admin)):
    t = Testimonial(**body.model_dump())
    await db.testimonials.insert_one(t.model_dump())
    return strip_id(t.model_dump())

@api.put("/testimonials/{tid}")
async def update_testimonial(tid: str, body: TestimonialIn, _: dict = Depends(require_admin)):
    res = await db.testimonials.update_one({"id": tid}, {"$set": body.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return await db.testimonials.find_one({"id": tid}, {"_id": 0})

@api.delete("/testimonials/{tid}")
async def delete_testimonial(tid: str, _: dict = Depends(require_admin)):
    res = await db.testimonials.delete_one({"id": tid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}

# ──────────────────────────────────────────────────────────────────────────────
# Site Content (singleton)
# ──────────────────────────────────────────────────────────────────────────────
@api.get("/site-content")
async def get_site_content():
    doc = await db.site_content.find_one({"key": "site"}, {"_id": 0})
    if not doc:
        default = SiteContent().model_dump()
        default["key"] = "site"
        await db.site_content.insert_one(default)
        default.pop("_id", None)
        return default
    return doc

@api.put("/site-content")
async def update_site_content(body: SiteContent, _: dict = Depends(require_admin)):
    data = body.model_dump()
    data["key"] = "site"
    await db.site_content.update_one({"key": "site"}, {"$set": data}, upsert=True)
    doc = await db.site_content.find_one({"key": "site"}, {"_id": 0})
    return doc

# ──────────────────────────────────────────────────────────────────────────────
# Orders / Stripe checkout
# ──────────────────────────────────────────────────────────────────────────────
@api.post("/checkout/session")
async def create_checkout(body: CheckoutIn, http_request: Request):
    if not body.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # Compute total from DB prices (NEVER trust frontend)
    total = 0.0
    line_summary = []
    for item in body.items:
        prod = await db.products.find_one({"id": item.product_id}, {"_id": 0})
        if not prod:
            raise HTTPException(status_code=400, detail=f"Product not found: {item.product_id}")
        if not prod.get("available", True):
            raise HTTPException(status_code=400, detail=f"Unavailable: {prod['name']}")
        qty = max(1, int(item.quantity))
        line_total = float(prod["price"]) * qty
        total += line_total
        line_summary.append({
            "product_id": prod["id"],
            "name": prod["name"],
            "price": float(prod["price"]),
            "quantity": qty,
            "line_total": line_total,
        })

    total = round(total, 2)
    order_id = str(uuid.uuid4())

    host_url = str(http_request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

    origin = body.origin_url.rstrip("/")
    success_url = f"{origin}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/cart"

    metadata = {
        "order_id": order_id,
        "customer_email": body.customer_email,
        "customer_name": body.customer_name,
        "customer_phone": body.customer_phone,
    }

    req = CheckoutSessionRequest(
        amount=total,
        currency="ngn",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata,
    )
    session: CheckoutSessionResponse = await stripe.create_checkout_session(req)

    # Persist order + payment_transaction
    order_doc = {
        "id": order_id,
        "customer_name": body.customer_name,
        "customer_phone": body.customer_phone,
        "customer_email": body.customer_email,
        "customer_address": body.customer_address,
        "items": line_summary,
        "amount": total,
        "currency": "NGN",
        "status": "pending",
        "session_id": session.session_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.orders.insert_one(order_doc)

    await db.payment_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "order_id": order_id,
        "session_id": session.session_id,
        "amount": total,
        "currency": "ngn",
        "metadata": metadata,
        "payment_status": "initiated",
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return {"url": session.url, "session_id": session.session_id, "order_id": order_id}

@api.get("/checkout/status/{session_id}")
async def checkout_status(session_id: str, http_request: Request):
    txn = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not txn:
        raise HTTPException(status_code=404, detail="Session not found")

    # If already finalized, return cached
    if txn["payment_status"] == "paid":
        return {"session_id": session_id, "payment_status": "paid", "status": "complete", "amount_total": txn["amount"]}

    host_url = str(http_request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

    status_resp: CheckoutStatusResponse = await stripe.get_checkout_status(session_id)

    new_payment_status = status_resp.payment_status
    new_status = status_resp.status

    update = {"payment_status": new_payment_status, "status": new_status,
              "updated_at": datetime.now(timezone.utc).isoformat()}
    await db.payment_transactions.update_one({"session_id": session_id}, {"$set": update})

    if new_payment_status == "paid" and txn["payment_status"] != "paid":
        await db.orders.update_one(
            {"id": txn["order_id"]},
            {"$set": {"status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}},
        )

    return {
        "session_id": session_id,
        "payment_status": new_payment_status,
        "status": new_status,
        "amount_total": status_resp.amount_total,
        "currency": status_resp.currency,
    }

@api.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature", "")
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    try:
        resp = await stripe.handle_webhook(body, signature)
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail="Invalid webhook")

    session_id = resp.session_id
    if not session_id:
        return {"ok": True}

    txn = await db.payment_transactions.find_one({"session_id": session_id})
    if not txn:
        return {"ok": True}

    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {"payment_status": resp.payment_status, "status": resp.event_type,
                  "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    if resp.payment_status == "paid" and txn.get("payment_status") != "paid":
        await db.orders.update_one(
            {"id": txn["order_id"]},
            {"$set": {"status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}},
        )
    return {"ok": True}

@api.get("/orders")
async def list_orders(_: dict = Depends(require_admin)):
    docs = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs

@api.get("/")
async def root():
    return {"app": "ProBites Signature API", "status": "ok"}

# ──────────────────────────────────────────────────────────────────────────────
# Seeding
# ──────────────────────────────────────────────────────────────────────────────
SEED_PRODUCTS = [
    {"name": "Signature Drip Cake", "category": "Cake", "price": 35000.0,
     "description": "Decadent layered vanilla cake with our signature violet ganache drip and Oreo crown.",
     "image_url": "https://images.unsplash.com/photo-1624802674607-93bedb6cb1aa?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NjZ8MHwxfHNlYXJjaHwyfHxwcmVtaXVtJTIwY2hvY29sYXRlJTIwY2FrZSUyMHNsaWNlfGVufDB8fHx8MTc4MTU5Mzk3M3ww&ixlib=rb-4.1.0&q=85",
     "featured": True},
    {"name": "Celebration Cake", "category": "Cake", "price": 28000.0,
     "description": "Customisable vanilla or chocolate cake — perfect for birthdays and intimate gatherings.",
     "image_url": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?crop=entropy&cs=srgb&fm=jpg&q=85",
     "featured": False},
    {"name": "Small Chops Platter", "category": "Small Chops", "price": 12000.0,
     "description": "Crispy puff puff, samosa and spring rolls. The classic Nigerian party tray.",
     "image_url": "https://images.unsplash.com/photo-1721980743533-49f5fa70994b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTF8MHwxfHNlYXJjaHwxfHxzYW1vc2ElMjBzcHJpbmclMjByb2xsc3xlbnwwfHx8fDE3ODE1OTM5OTd8MA&ixlib=rb-4.1.0&q=85",
     "featured": True},
    {"name": "Classic Chinchin", "category": "Chinchin", "price": 3500.0,
     "description": "Golden, crunchy and lightly sweet. Our heritage recipe, freshly fried.",
     "image_url": "https://images.unsplash.com/photo-1599629954294-14df9ec8bc03?crop=entropy&cs=srgb&fm=jpg&q=85",
     "featured": True},
    {"name": "Honey Roasted Peanuts", "category": "Peanuts", "price": 4500.0,
     "description": "Slow-roasted peanuts kissed with raw Nigerian honey. Glass-jar packed.",
     "image_url": "https://images.unsplash.com/photo-1575399872095-9363bf262e64?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzV8MHwxfHNlYXJjaHwyfHxwZWFudXRzJTIwcm9hc3RlZCUyMHNuYWNrc3xlbnwwfHx8fDE3ODE1OTM5OTd8MA&ixlib=rb-4.1.0&q=85",
     "featured": True},
    {"name": "Strawberry Yoghurt", "category": "Yoghurt", "price": 2500.0,
     "description": "Thick, creamy yoghurt blended with real strawberries. Bottled cold.",
     "image_url": "https://images.unsplash.com/photo-1571212515416-fef01fc43637?crop=entropy&cs=srgb&fm=jpg&q=85",
     "featured": False},
    {"name": "Cake Parfait Cup", "category": "Cake Parfait", "price": 5500.0,
     "description": "Layers of moist cake, vanilla cream and berry compote in a take-away cup.",
     "image_url": "https://images.unsplash.com/photo-1488477181946-6428a0291777?crop=entropy&cs=srgb&fm=jpg&q=85",
     "featured": True},
    {"name": "Fruit Parfait Cup", "category": "Fruit Parfait", "price": 5000.0,
     "description": "Greek yoghurt, granola and a rainbow of fresh tropical fruit.",
     "image_url": "https://images.unsplash.com/photo-1571230389215-b34a89739ef1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2ODl8MHwxfHNlYXJjaHwzfHx5b2d1cnQlMjBwYXJmYWl0JTIwZ2xhc3N8ZW58MHx8fHwxNzgxNTkzOTczfDA&ixlib=rb-4.1.0&q=85",
     "featured": True},
]

SEED_TESTIMONIALS = [
    {"name": "Adaeze O.", "location": "Maitama, Abuja",
     "quote": "The drip cake was the centrepiece of my daughter's birthday. Absolutely worth every Naira.",
     "rating": 5,
     "image_url": "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Mr. Tunde", "location": "Wuse 2",
     "quote": "I ordered small chops for my office party — gone in 20 minutes. ProBites is now our default caterer.",
     "rating": 5,
     "image_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Chioma A.", "location": "Gwarinpa",
     "quote": "Their fruit parfait is my Saturday ritual. Fresh, generous, and beautifully presented.",
     "rating": 5,
     "image_url": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?crop=entropy&cs=srgb&fm=jpg&q=85"},
]

async def seed():
    # Admin
    existing = await db.users.find_one({"email": ADMIN_EMAIL})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": ADMIN_EMAIL,
            "password_hash": hash_password(ADMIN_PASSWORD),
            "name": "ProBites Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Seeded admin: {ADMIN_EMAIL}")
    elif not verify_password(ADMIN_PASSWORD, existing["password_hash"]):
        await db.users.update_one({"email": ADMIN_EMAIL},
                                  {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}})
        logger.info("Admin password rehashed")

    # Products
    if await db.products.count_documents({}) == 0:
        for p in SEED_PRODUCTS:
            data = {**p}
            data.setdefault("description", "")
            data.setdefault("featured", False)
            data["available"] = True
            prod = Product(**data, slug=data["name"].lower().replace(" ", "-"))
            await db.products.insert_one(prod.model_dump())
        logger.info(f"Seeded {len(SEED_PRODUCTS)} products")

    # Testimonials
    if await db.testimonials.count_documents({}) == 0:
        for t in SEED_TESTIMONIALS:
            tt = Testimonial(**t)
            await db.testimonials.insert_one(tt.model_dump())
        logger.info("Seeded testimonials")

    # Site content
    if await db.site_content.find_one({"key": "site"}) is None:
        default = SiteContent().model_dump()
        default["key"] = "site"
        await db.site_content.insert_one(default)
        logger.info("Seeded site content")

@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.products.create_index("id", unique=True)
    await db.products.create_index("slug")
    await db.testimonials.create_index("id", unique=True)
    await db.orders.create_index("id", unique=True)
    await db.payment_transactions.create_index("session_id", unique=True)
    await db.site_content.create_index("key", unique=True)
    await seed()

@app.on_event("shutdown")
async def on_shutdown():
    client.close()

app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origin_regex=".*",
    allow_methods=["*"],
    allow_headers=["*"],
)
