from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.database.database import get_db
from app.models.sale import Sale
from app.models.customer import Customer
from app.models.product import Product
from app.models.sale_item import SaleItem
from app.schemas.sale import SaleCreate
from app.auth.role_checker import admin_only, any_logged_in_user

router = APIRouter()


# ─────────────────────────────────────────────
# CREATE SALE — any logged-in user
# ─────────────────────────────────────────────
@router.post("/sales")
def create_sale(
    sale: SaleCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(any_logged_in_user)
):
    new_sale = Sale(
        customer_id=sale.customer_id,
        total_amount=sale.total_amount,
        status="Pending"
    )
    db.add(new_sale)
    db.commit()
    db.refresh(new_sale)

    return {
        "message": "Sale Created Successfully",
        "sale": new_sale
    }


# ─────────────────────────────────────────────
# SALES DASHBOARD — with KPI trend indicators
# Returns current + last month data for % change
# ─────────────────────────────────────────────
@router.get("/sales/dashboard")
def sales_dashboard(
    db: Session = Depends(get_db),
    current_user: dict = Depends(any_logged_in_user)
):
    now = datetime.utcnow()

    # Current month date range
    current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Last month date range
    last_month_end = current_month_start - timedelta(seconds=1)
    last_month_start = last_month_end.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # ── TOTAL (ALL TIME) ──
    total_sales = db.query(Sale).count()
    total_revenue = db.query(func.sum(Sale.total_amount)).scalar() or 0

    # ── CURRENT MONTH ──
    current_sales = db.query(Sale).filter(
        Sale.created_at >= current_month_start
    ).count()

    current_revenue = db.query(func.sum(Sale.total_amount)).filter(
        Sale.created_at >= current_month_start
    ).scalar() or 0

    # ── LAST MONTH ──
    last_sales = db.query(Sale).filter(
        Sale.created_at >= last_month_start,
        Sale.created_at <= last_month_end
    ).count()

    last_revenue = db.query(func.sum(Sale.total_amount)).filter(
        Sale.created_at >= last_month_start,
        Sale.created_at <= last_month_end
    ).scalar() or 0

    # ── PENDING DELIVERIES & PAYMENTS (based on actual status) ──
    pending_deliveries = db.query(Sale).filter(
        Sale.status == "Pending"
    ).count()

    pending_payments = db.query(func.sum(Sale.total_amount)).filter(
        Sale.status == "Pending"
    ).scalar() or 0

    # ── % CHANGE CALCULATIONS ──
    def pct_change(current, previous):
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        return round(((current - previous) / previous) * 100, 1)

    return {
        # All-time totals
        "total_sales": total_sales,
        "total_revenue": round(total_revenue, 2),

        # Current vs last month for trend arrows
        "current_month_sales": current_sales,
        "current_month_revenue": round(current_revenue, 2),
        "last_month_sales": last_sales,
        "last_month_revenue": round(last_revenue, 2),

        # % change (positive = up ↑, negative = down ↓)
        "sales_change_pct": pct_change(current_sales, last_sales),
        "revenue_change_pct": pct_change(current_revenue, last_revenue),

        # Extra KPIs
        "pending_deliveries": pending_deliveries,
        "pending_payments": round(pending_payments, 2),
        "total_customers": db.query(Sale.customer_id).distinct().count(),
    }


# ─────────────────────────────────────────────
# SALES CHART — monthly revenue + sales count
# ─────────────────────────────────────────────
@router.get("/sales/chart")
def sales_chart(
    db: Session = Depends(get_db),
    current_user: dict = Depends(any_logged_in_user)
):
    sales = db.query(Sale).all()
    monthly_data = {}

    for sale in sales:
        month = sale.created_at.strftime("%b")
        if month not in monthly_data:
            monthly_data[month] = {"month": month, "sales": 0, "revenue": 0}
        monthly_data[month]["sales"] += 1
        monthly_data[month]["revenue"] += sale.total_amount

    return list(monthly_data.values())


# ─────────────────────────────────────────────
# SALES WITH CUSTOMER NAMES — uses relationship
# ─────────────────────────────────────────────
@router.get("/sales/with-details")
def get_sales_with_details(
    db: Session = Depends(get_db),
    current_user: dict = Depends(any_logged_in_user)
):
    sales = db.query(Sale).order_by(Sale.id.desc()).all()

    result = []
    for sale in sales:
        # sale.customer works because of relationship() in the model
        customer = sale.customer

        result.append({
            "id": sale.id,
            "sale_number": f"SO-2025-{str(sale.id).zfill(3)}",
            "customer_id": sale.customer_id,
            "customer_name": customer.name  if customer else "Walk-in Customer",
            "customer_email": customer.email if customer else "-",
            "customer_phone": customer.phone if customer else "-",
            "total_amount": sale.total_amount,
            "created_at": sale.created_at.strftime("%Y-%m-%d") if sale.created_at else "-",
            "status": sale.status or "Pending",
            "delivery_method": "Local Delivery",
        })

    return result



# ─────────────────────────────────────────────
# SALES BY CATEGORY — for Reports pie/bar chart
# ─────────────────────────────────────────────
@router.get("/sales/by-category")
def sales_by_category(
    db: Session = Depends(get_db),
    current_user: dict = Depends(any_logged_in_user)
):
    # Join SaleItem → Product to get category breakdown
    results = db.query(
        Product.category,
        func.count(SaleItem.id).label("count"),
        func.sum(SaleItem.quantity).label("units_sold")
    ).join(
        SaleItem, SaleItem.product_id == Product.id
    ).group_by(
        Product.category
    ).all()

    return [
        {
            "category": r.category or "General",
            "count": r.count,
            "units_sold": r.units_sold
        }
        for r in results
    ]


# ─────────────────────────────────────────────
# REVENUE VS EXPENSE — for Reports line chart
# ─────────────────────────────────────────────
@router.get("/sales/revenue-vs-expense")
def revenue_vs_expense(
    db: Session = Depends(get_db),
    current_user: dict = Depends(any_logged_in_user)
):
    from app.models.purchase import Purchase

    sales = db.query(Sale).all()
    purchases = db.query(Purchase).all()

    # Build monthly revenue
    monthly_revenue = {}
    for sale in sales:
        month = sale.created_at.strftime("%b")
        monthly_revenue[month] = monthly_revenue.get(month, 0) + sale.total_amount

    # Build monthly expense (from purchases)
    monthly_expense = {}
    for purchase in purchases:
        if purchase.created_at:
            month = purchase.created_at.strftime("%b")
            monthly_expense[month] = monthly_expense.get(month, 0) + (purchase.total_amount or 0)

    # Merge both into one list
    all_months = sorted(set(list(monthly_revenue.keys()) + list(monthly_expense.keys())))

    return [
        {
            "month": m,
            "revenue": round(monthly_revenue.get(m, 0), 2),
            "expense": round(monthly_expense.get(m, 0), 2),
        }
        for m in all_months
    ]


# ─────────────────────────────────────────────
# GET ALL SALES (simple)
# ─────────────────────────────────────────────
@router.get("/sales")
def get_all_sales(
    db: Session = Depends(get_db),
    current_user: dict = Depends(any_logged_in_user)
):
    return db.query(Sale).order_by(Sale.id.desc()).all()


# ─────────────────────────────────────────────
# DELETE SALE — admin only
# ─────────────────────────────────────────────
@router.delete("/sales/{sale_id}")
def delete_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(admin_only)
):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    db.delete(sale)
    db.commit()
    return {"message": "Sale Deleted Successfully"}


# ─────────────────────────────────────────────
# UPDATE SALE STATUS — employee or above
# ─────────────────────────────────────────────
@router.patch("/sales/{sale_id}/status")
def update_sale_status(
    sale_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(any_logged_in_user)
):
    valid_statuses = ["Pending", "Completed", "Cancelled"]
    if status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {valid_statuses}"
        )

    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    sale.status = status
    db.commit()

    return {"message": f"Sale status updated to '{status}'"}