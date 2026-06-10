"""
AI Router — Phase 3
Contains 4 AI features:
  1. /ai/forecast/{product_id}   — Demand Forecasting (pure Python math)
  2. /ai/revenue-forecast        — Revenue Forecast (linear trend)
  3. /ai/anomalies               — Anomaly Detection (rule-based)
  4. /ai/chat                    — Gemini AI Chatbot (needs API key in .env)
  5. /ai/dashboard-insights      — Top AI summaries for Dashboard widget
"""

import os
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.database.database import get_db
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.product import Product
from app.models.purchase import Purchase
from app.models.customer import Customer
from app.auth.role_checker import any_logged_in_user

router = APIRouter(prefix="/ai", tags=["AI"])


# ─────────────────────────────────────────────────────────────────────────────
# HELPER: % change calculation
# ─────────────────────────────────────────────────────────────────────────────
def pct_change(current, previous):
    if previous == 0:
        return 100.0 if current > 0 else 0.0
    return round(((current - previous) / previous) * 100, 1)


# ─────────────────────────────────────────────────────────────────────────────
# 1. DEMAND FORECASTING
#    Analyzes past 30-day sales velocity → predicts next 30 days
#    Compares with current stock → suggests reorder quantity + urgency
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/forecast/{product_id}")
def forecast_demand(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(any_logged_in_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Get units sold in last 30 days from sale_items
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    sold_last_30 = db.query(func.sum(SaleItem.quantity)).join(
        Sale, Sale.id == SaleItem.sale_id
    ).filter(
        SaleItem.product_id == product_id,
        Sale.created_at >= thirty_days_ago
    ).scalar() or 0

    # Get units sold in last 60-30 days (previous period for trend)
    sixty_days_ago = datetime.utcnow() - timedelta(days=60)
    sold_prev_30 = db.query(func.sum(SaleItem.quantity)).join(
        Sale, Sale.id == SaleItem.sale_id
    ).filter(
        SaleItem.product_id == product_id,
        Sale.created_at >= sixty_days_ago,
        Sale.created_at < thirty_days_ago
    ).scalar() or 0

    # Daily sales rate
    daily_rate = sold_last_30 / 30 if sold_last_30 > 0 else 0.5   # min 0.5/day assumption

    # Next 30-day prediction
    predicted_next_30 = round(daily_rate * 30)

    # Days of stock remaining at current rate
    days_of_stock = round(product.stock / daily_rate) if daily_rate > 0 else 999

    # Reorder quantity needed
    reorder_qty = max(0, predicted_next_30 - product.stock)

    # Urgency
    if days_of_stock <= 7:
        urgency = "CRITICAL"
        urgency_color = "#EF4444"
    elif days_of_stock <= 14:
        urgency = "HIGH"
        urgency_color = "#F59E0B"
    elif days_of_stock <= 30:
        urgency = "MEDIUM"
        urgency_color = "#3B82F6"
    else:
        urgency = "LOW"
        urgency_color = "#10B981"

    # Trend vs previous period
    trend_pct = pct_change(sold_last_30, sold_prev_30)
    trend_direction = "↑ Growing" if trend_pct > 0 else ("↓ Declining" if trend_pct < 0 else "→ Stable")

    return {
        "product_id": product.id,
        "product_name": product.name,
        "category": product.category,
        "current_stock": product.stock,
        "reorder_level": product.reorder_level,

        # Demand analysis
        "sold_last_30_days": sold_last_30,
        "sold_previous_30_days": sold_prev_30,
        "daily_sales_rate": round(daily_rate, 2),
        "trend_pct": trend_pct,
        "trend_direction": trend_direction,

        # Forecast
        "predicted_demand_next_30_days": predicted_next_30,
        "days_of_stock_remaining": days_of_stock,

        # Recommendation
        "suggested_reorder_quantity": reorder_qty,
        "urgency": urgency,
        "urgency_color": urgency_color,
        "recommendation": (
            f"Reorder {reorder_qty} units immediately — only {days_of_stock} days of stock left."
            if reorder_qty > 0
            else f"Stock is sufficient for {days_of_stock} days. No reorder needed."
        )
    }


# ─────────────────────────────────────────────────────────────────────────────
# 2. REVENUE FORECASTING
#    Uses linear trend from last 6 months → predicts next month revenue
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/revenue-forecast")
def revenue_forecast(
    db: Session = Depends(get_db),
    current_user: dict = Depends(any_logged_in_user)
):
    now = datetime.utcnow()
    monthly_revenues = []

    # Collect last 6 months of revenue
    for i in range(5, -1, -1):
        # Start of month i months ago
        target = now.replace(day=1) - timedelta(days=i * 30)
        month_start = target.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        if month_start.month == 12:
            month_end = month_start.replace(year=month_start.year + 1, month=1)
        else:
            month_end = month_start.replace(month=month_start.month + 1)

        revenue = db.query(func.sum(Sale.total_amount)).filter(
            Sale.created_at >= month_start,
            Sale.created_at < month_end
        ).scalar() or 0

        monthly_revenues.append({
            "month": month_start.strftime("%b %Y"),
            "month_short": month_start.strftime("%b"),
            "revenue": round(revenue, 2)
        })

    # Linear trend: average month-over-month change
    revenues_only = [m["revenue"] for m in monthly_revenues]
    if len(revenues_only) >= 2:
        # Average growth per month over the period
        changes = [revenues_only[i+1] - revenues_only[i] for i in range(len(revenues_only)-1)]
        avg_monthly_growth = sum(changes) / len(changes)
        last_revenue = revenues_only[-1]
        predicted_next_month = max(0, round(last_revenue + avg_monthly_growth, 2))
    else:
        avg_monthly_growth = 0
        predicted_next_month = revenues_only[-1] if revenues_only else 0

    # Total & average
    total_6m = sum(revenues_only)
    avg_monthly = round(total_6m / 6, 2) if total_6m > 0 else 0
    growth_pct  = pct_change(revenues_only[-1], revenues_only[-2]) if len(revenues_only) >= 2 else 0

    # Next month name
    next_month_name = (now.replace(day=1) + timedelta(days=32)).replace(day=1).strftime("%B %Y")

    return {
        "monthly_data": monthly_revenues,
        "predicted_next_month": predicted_next_month,
        "next_month_name": next_month_name,
        "avg_monthly_growth": round(avg_monthly_growth, 2),
        "avg_monthly_revenue": avg_monthly,
        "total_6_months": round(total_6m, 2),
        "last_month_growth_pct": growth_pct,
        "trend": "↑ Growing" if avg_monthly_growth > 0 else ("↓ Declining" if avg_monthly_growth < 0 else "→ Stable"),
        "confidence": "High" if len([r for r in revenues_only if r > 0]) >= 4 else "Low (not enough data)",
    }


# ─────────────────────────────────────────────────────────────────────────────
# 3. ANOMALY DETECTION
#    Flags: unusual sale amounts, sudden stock drops, and suspicious patterns
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/anomalies")
def detect_anomalies(
    db: Session = Depends(get_db),
    current_user: dict = Depends(any_logged_in_user)
):
    anomalies = []

    # ── Rule 1: Sales > 3x average ────────────────────────────────────────────
    all_sales = db.query(Sale).all()
    if all_sales:
        avg_sale = sum(s.total_amount for s in all_sales) / len(all_sales)
        threshold = avg_sale * 3

        for sale in all_sales:
            if sale.total_amount > threshold:
                customer = sale.customer
                anomalies.append({
                    "type": "HIGH_VALUE_SALE",
                    "severity": "MEDIUM",
                    "severity_color": "#F59E0B",
                    "icon": "💰",
                    "title": f"Unusually large sale detected",
                    "detail": f"Sale #{sale.id} to {customer.name if customer else 'Unknown'} is ₹{sale.total_amount:,.0f} — {round(sale.total_amount/avg_sale, 1)}× the average (₹{avg_sale:,.0f})",
                    "timestamp": sale.created_at.strftime("%Y-%m-%d") if sale.created_at else "-",
                    "action": "Review this sale for accuracy",
                })

    # ── Rule 2: Products critically below reorder level ───────────────────────
    critical_products = db.query(Product).filter(
        Product.stock < (Product.reorder_level * 0.5),   # below 50% of reorder level
        Product.stock > 0
    ).all()

    for product in critical_products:
        anomalies.append({
            "type": "CRITICAL_STOCK",
            "severity": "HIGH",
            "severity_color": "#EF4444",
            "icon": "⚠️",
            "title": f"Critical stock: {product.name}",
            "detail": f"Stock ({product.stock} units) is below 50% of reorder level ({product.reorder_level} units). Immediate reorder needed.",
            "timestamp": "Now",
            "action": f"Reorder at least {product.reorder_level * 2 - product.stock} units",
        })

    # ── Rule 3: Products completely out of stock ───────────────────────────────
    out_of_stock = db.query(Product).filter(Product.stock == 0).all()
    for product in out_of_stock:
        anomalies.append({
            "type": "OUT_OF_STOCK",
            "severity": "CRITICAL",
            "severity_color": "#DC2626",
            "icon": "🔴",
            "title": f"Out of stock: {product.name}",
            "detail": f"{product.name} (SKU: {product.sku}) has zero inventory. Sales of this product are blocked.",
            "timestamp": "Now",
            "action": "Restock immediately",
        })

    # ── Rule 4: No sales in last 7 days ───────────────────────────────────────
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_sales_count = db.query(Sale).filter(Sale.created_at >= week_ago).count()
    if recent_sales_count == 0 and len(all_sales) > 0:
        anomalies.append({
            "type": "NO_RECENT_SALES",
            "severity": "HIGH",
            "severity_color": "#F59E0B",
            "icon": "📉",
            "title": "No sales in the last 7 days",
            "detail": "Your business has had zero sales activity in the past week. This may indicate a system issue or business slowdown.",
            "timestamp": "Last 7 days",
            "action": "Check if sales are being recorded correctly",
        })

    # Sort: CRITICAL first, then HIGH, then MEDIUM
    severity_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    anomalies.sort(key=lambda x: severity_order.get(x["severity"], 99))

    return {
        "total_anomalies": len(anomalies),
        "critical_count": len([a for a in anomalies if a["severity"] == "CRITICAL"]),
        "high_count":     len([a for a in anomalies if a["severity"] == "HIGH"]),
        "medium_count":   len([a for a in anomalies if a["severity"] == "MEDIUM"]),
        "anomalies": anomalies,
    }


# ─────────────────────────────────────────────────────────────────────────────
# 4. AI DASHBOARD INSIGHTS
#    Returns top 3 AI recommendations for the dashboard widget
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/dashboard-insights")
def dashboard_insights(
    db: Session = Depends(get_db),
    current_user: dict = Depends(any_logged_in_user)
):
    insights = []

    # Insight 1: Top selling product
    top = db.query(
        SaleItem.product_id,
        func.sum(SaleItem.quantity).label("total_sold")
    ).group_by(SaleItem.product_id).order_by(func.sum(SaleItem.quantity).desc()).first()

    if top:
        product = db.query(Product).filter(Product.id == top.product_id).first()
        if product:
            insights.append({
                "icon": "🏆",
                "color": "#7C3AED",
                "title": "Top Selling Product",
                "value": product.name,
                "detail": f"{top.total_sold} units sold total",
            })

    # Insight 2: Most valuable customer
    top_customer = db.query(
        Sale.customer_id,
        func.sum(Sale.total_amount).label("total_spent")
    ).group_by(Sale.customer_id).order_by(func.sum(Sale.total_amount).desc()).first()

    if top_customer:
        customer = db.query(Customer).filter(Customer.id == top_customer.customer_id).first()
        if customer:
            insights.append({
                "icon": "👑",
                "color": "#10B981",
                "title": "Best Customer",
                "value": customer.name,
                "detail": f"₹{top_customer.total_spent:,.0f} total purchases",
            })

    # Insight 3: Revenue this month vs last month
    now = datetime.utcnow()
    this_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_start = (this_month_start - timedelta(days=1)).replace(day=1)

    this_month_rev = db.query(func.sum(Sale.total_amount)).filter(
        Sale.created_at >= this_month_start
    ).scalar() or 0

    last_month_rev = db.query(func.sum(Sale.total_amount)).filter(
        Sale.created_at >= last_month_start,
        Sale.created_at < this_month_start
    ).scalar() or 0

    change = pct_change(this_month_rev, last_month_rev)
    insights.append({
        "icon": "📈" if change >= 0 else "📉",
        "color": "#10B981" if change >= 0 else "#EF4444",
        "title": "Monthly Revenue Trend",
        "value": f"₹{this_month_rev:,.0f}",
        "detail": f"{'↑' if change >= 0 else '↓'} {abs(change)}% vs last month",
    })

    # Insight 4: Low stock count
    low_count = db.query(Product).filter(
        Product.stock <= Product.reorder_level
    ).count()
    if low_count > 0:
        insights.append({
            "icon": "⚠️",
            "color": "#F59E0B",
            "title": "Reorder Needed",
            "value": f"{low_count} products",
            "detail": "Stock below reorder level — act now",
        })

    return {"insights": insights[:4]}   # return top 4 max


# ─────────────────────────────────────────────────────────────────────────────
# 5. ALL PRODUCTS FORECAST — for the AI Insights page table
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/forecast-all")
def forecast_all_products(
    db: Session = Depends(get_db),
    current_user: dict = Depends(any_logged_in_user)
):
    products = db.query(Product).all()
    results = []

    thirty_days_ago = datetime.utcnow() - timedelta(days=30)

    for product in products:
        sold_last_30 = db.query(func.sum(SaleItem.quantity)).join(
            Sale, Sale.id == SaleItem.sale_id
        ).filter(
            SaleItem.product_id == product.id,
            Sale.created_at >= thirty_days_ago
        ).scalar() or 0

        daily_rate = sold_last_30 / 30 if sold_last_30 > 0 else 0.3
        days_of_stock = round(product.stock / daily_rate) if daily_rate > 0 else 999
        predicted_next_30 = round(daily_rate * 30)
        reorder_qty = max(0, predicted_next_30 - product.stock)

        if days_of_stock <= 7:
            urgency = "CRITICAL"
        elif days_of_stock <= 14:
            urgency = "HIGH"
        elif days_of_stock <= 30:
            urgency = "MEDIUM"
        else:
            urgency = "LOW"

        results.append({
            "product_id": product.id,
            "product_name": product.name,
            "category": product.category or "General",
            "current_stock": product.stock,
            "sold_last_30_days": sold_last_30,
            "predicted_next_30_days": predicted_next_30,
            "days_of_stock_remaining": min(days_of_stock, 999),
            "suggested_reorder_qty": reorder_qty,
            "urgency": urgency,
        })

    # Sort by urgency (most critical first)
    urgency_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    results.sort(key=lambda x: urgency_order.get(x["urgency"], 99))

    return results


# ─────────────────────────────────────────────────────────────────────────────
# 6. GEMINI AI CHATBOT
#    Fetches live DB data → sends to Gemini → returns natural language answer
#    Requires GEMINI_API_KEY in .env file
# ─────────────────────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    question: str


@router.post("/chat")
def chat_with_erp(
    body: ChatRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(any_logged_in_user)
):
    api_key = os.getenv("GEMINI_API_KEY", "")

    if not api_key or api_key == "your_gemini_api_key_here":
        # Return a helpful fallback without crashing
        return {
            "answer": (
                "🔑 Gemini API key not configured yet.\n\n"
                "To enable AI chat:\n"
                "1. Go to https://aistudio.google.com/apikey\n"
                "2. Create a free API key\n"
                "3. Open BACKEND/.env\n"
                "4. Replace 'your_gemini_api_key_here' with your key\n"
                "5. Restart the backend server\n\n"
                "The AI will then answer questions using your live ERP data! 🚀"
            )
        }

    try:
        import google.generativeai as genai

        genai.configure(api_key=api_key)

        # ── Fetch live context from DB ──
        total_products  = db.query(Product).count()
        total_revenue   = db.query(func.sum(Sale.total_amount)).scalar() or 0
        total_sales     = db.query(Sale).count()
        total_customers = db.query(Customer).count()
        low_stock_count = db.query(Product).filter(
            Product.stock <= Product.reorder_level
        ).count()
        out_of_stock    = db.query(Product).filter(Product.stock == 0).count()

        # Top 3 products by sales
        top_products_raw = db.query(
            SaleItem.product_id, func.sum(SaleItem.quantity).label("qty")
        ).group_by(SaleItem.product_id).order_by(func.sum(SaleItem.quantity).desc()).limit(3).all()

        top_products_str = ""
        for row in top_products_raw:
            p = db.query(Product).filter(Product.id == row.product_id).first()
            if p:
                top_products_str += f"  - {p.name}: {row.qty} units sold\n"

        # Top customer
        top_cust_raw = db.query(
            Sale.customer_id, func.sum(Sale.total_amount).label("spent")
        ).group_by(Sale.customer_id).order_by(func.sum(Sale.total_amount).desc()).first()

        top_cust_str = "None yet"
        if top_cust_raw:
            c = db.query(Customer).filter(Customer.id == top_cust_raw.customer_id).first()
            if c:
                top_cust_str = f"{c.name} (₹{top_cust_raw.spent:,.0f})"

        # Build context
        context = f"""
You are an intelligent ERP assistant for RetailFlow ERP, a retail management system.
Your job is to answer business questions using the live data provided below.
Be concise, helpful, and use bullet points when listing things. Use Indian Rupee (₹) for amounts.

=== CURRENT BUSINESS DATA ===
Total Products in catalog: {total_products}
Total Revenue (all time): ₹{total_revenue:,.2f}
Total Sales Orders: {total_sales}
Total Customers: {total_customers}
Low Stock Products (at or below reorder level): {low_stock_count}
Out of Stock Products: {out_of_stock}
Best Customer: {top_cust_str}

Top Selling Products:
{top_products_str if top_products_str else "  No sales data yet"}

=== USER'S QUESTION ===
{body.question}

Answer clearly and helpfully based on this data. If you don't have enough data to answer precisely, say so and give general advice.
"""

        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(context)
        return {"answer": response.text}

    except Exception as e:
        return {
            "answer": f"⚠️ AI Error: {str(e)}\n\nPlease check your Gemini API key in the .env file."
        }
