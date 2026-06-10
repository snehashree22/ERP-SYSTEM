from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime

from app.database.database import get_db
from app.models.sale import Sale
from app.models.customer import Customer
from app.models.sale_item import SaleItem
from app.models.product import Product
from app.auth.role_checker import any_logged_in_user

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors

router = APIRouter()


@router.get("/invoice/{sale_id}")
def get_invoice(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(any_logged_in_user)
):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    # Fetch customer
    customer = db.query(Customer).filter(Customer.id == sale.customer_id).first()
    customer_name = customer.name if customer else "Walk-in Customer"
    customer_email = customer.email if customer else "-"
    customer_phone = customer.phone if customer else "-"

    # Fetch sale items
    sale_items = db.query(SaleItem).filter(SaleItem.sale_id == sale_id).all()

    pdf_file = f"invoice_{sale.id}.pdf"
    page_width, page_height = A4  # 595 x 842 points

    c = canvas.Canvas(pdf_file, pagesize=A4)

    # ─── HEADER BAR ───────────────────────────────────────
    c.setFillColorRGB(0.047, 0.039, 0.145)   # #0F0A25 purple
    c.rect(0, page_height - 80, page_width, 80, fill=True, stroke=False)

    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(40, page_height - 50, "RetailFlow ERP")
    c.setFont("Helvetica", 10)
    c.drawString(40, page_height - 68, "Smart Retail Management System")

    # Invoice label on right
    c.setFont("Helvetica-Bold", 18)
    c.drawRightString(page_width - 40, page_height - 48, "INVOICE")
    c.setFont("Helvetica", 10)
    c.drawRightString(page_width - 40, page_height - 66, f"#{str(sale.id).zfill(5)}")

    # ─── INVOICE META ─────────────────────────────────────
    c.setFillColor(colors.black)
    c.setFont("Helvetica", 10)
    y = page_height - 110

    c.drawString(40, y, "Date:")
    c.setFont("Helvetica-Bold", 10)
    c.drawString(120, y, datetime.utcnow().strftime("%d %B %Y"))

    c.setFont("Helvetica", 10)
    c.drawString(40, y - 18, "Invoice No:")
    c.setFont("Helvetica-Bold", 10)
    c.drawString(120, y - 18, f"INV-{str(sale.id).zfill(5)}")

    # ─── BILL TO ──────────────────────────────────────────
    c.setFillColorRGB(0.047, 0.039, 0.145)
    c.rect(40, y - 90, 220, 65, fill=True, stroke=False)

    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(50, y - 40, "BILL TO")

    c.setFont("Helvetica-Bold", 11)
    c.drawString(50, y - 55, customer_name)
    c.setFont("Helvetica", 9)
    c.drawString(50, y - 68, customer_email)
    c.drawString(50, y - 80, customer_phone)

    # ─── TABLE HEADER ─────────────────────────────────────
    table_top = y - 120
    c.setFillColorRGB(0.47, 0.22, 0.93)  # Purple
    c.rect(40, table_top, page_width - 80, 22, fill=True, stroke=False)

    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(50, table_top + 7, "#")
    c.drawString(80, table_top + 7, "Product")
    c.drawString(300, table_top + 7, "Qty")
    c.drawString(360, table_top + 7, "Unit Price")
    c.drawString(460, table_top + 7, "Amount")

    # ─── TABLE ROWS ───────────────────────────────────────
    c.setFillColor(colors.black)
    c.setFont("Helvetica", 10)
    row_y = table_top - 20
    subtotal = 0

    if sale_items:
        for i, item in enumerate(sale_items):
            product = db.query(Product).filter(Product.id == item.product_id).first()
            product_name = product.name if product else f"Product #{item.product_id}"
            unit_price = product.price if product else 0
            line_total = item.quantity * unit_price
            subtotal += line_total

            # Alternating row bg
            if i % 2 == 0:
                c.setFillColorRGB(0.97, 0.97, 0.99)
                c.rect(40, row_y - 5, page_width - 80, 20, fill=True, stroke=False)
                c.setFillColor(colors.black)

            c.drawString(50, row_y, str(i + 1))
            c.drawString(80, row_y, product_name[:30])
            c.drawString(300, row_y, str(item.quantity))
            c.drawString(360, row_y, f"Rs {unit_price:,.2f}")
            c.drawString(460, row_y, f"Rs {line_total:,.2f}")
            row_y -= 22
    else:
        # No sale items — use total_amount directly
        subtotal = sale.total_amount
        c.drawString(50, row_y, "1")
        c.drawString(80, row_y, "Sale Items")
        c.drawString(300, row_y, "1")
        c.drawString(360, row_y, f"Rs {sale.total_amount:,.2f}")
        c.drawString(460, row_y, f"Rs {sale.total_amount:,.2f}")
        row_y -= 22

    # ─── TOTALS BOX ───────────────────────────────────────
    gst_rate = 0.18
    gst_amount = subtotal * gst_rate
    grand_total = subtotal + gst_amount

    totals_y = row_y - 20
    c.setFillColorRGB(0.95, 0.95, 0.98)
    c.rect(350, totals_y - 50, page_width - 390, 70, fill=True, stroke=False)

    c.setFillColor(colors.black)
    c.setFont("Helvetica", 10)
    c.drawString(360, totals_y, "Subtotal:")
    c.drawRightString(page_width - 45, totals_y, f"Rs {subtotal:,.2f}")

    c.drawString(360, totals_y - 18, "GST (18%):")
    c.drawRightString(page_width - 45, totals_y - 18, f"Rs {gst_amount:,.2f}")

    # Grand total bar
    c.setFillColorRGB(0.047, 0.039, 0.145)
    c.rect(350, totals_y - 55, page_width - 390, 22, fill=True, stroke=False)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(360, totals_y - 48, "GRAND TOTAL:")
    c.drawRightString(page_width - 45, totals_y - 48, f"Rs {grand_total:,.2f}")

    # ─── FOOTER ───────────────────────────────────────────
    c.setFillColorRGB(0.047, 0.039, 0.145)
    c.rect(0, 0, page_width, 40, fill=True, stroke=False)
    c.setFillColor(colors.white)
    c.setFont("Helvetica", 9)
    c.drawCentredString(page_width / 2, 24, "Thank you for your business! | RetailFlow ERP | smart-retail.erp")
    c.drawCentredString(page_width / 2, 12, "This is a computer-generated invoice and does not require a signature.")

    c.save()

    return FileResponse(
        path=pdf_file,
        media_type="application/pdf",
        filename=f"Invoice-{str(sale.id).zfill(5)}.pdf"
    )


# ─────────────────────────────────────────────
# GENERATE PDF REPORTS
# ─────────────────────────────────────────────
@router.get("/reports/generate")
def generate_report(
    type: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(any_logged_in_user)
):
    from app.models.purchase import Purchase
    from app.models.supplier import Supplier

    pdf_file = f"report_{type}.pdf"
    page_width, page_height = A4  # 595 x 842 points
    c = canvas.Canvas(pdf_file, pagesize=A4)

    # ─── HEADER BAR ───────────────────────────────────────
    c.setFillColorRGB(0.047, 0.039, 0.145)   # #0F0A25 purple
    c.rect(0, page_height - 80, page_width, 80, fill=True, stroke=False)

    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(40, page_height - 50, "RetailFlow ERP Reports")
    c.setFont("Helvetica", 10)
    c.drawString(40, page_height - 68, "Smart Retail Management System Summary")

    title_map = {
        "sales": "Sales Summary Report",
        "purchases": "Purchase & Order Report",
        "inventory": "Inventory & Stock levels",
        "financial": "Financial Statement Summary",
        "pl": "Profit & Loss Summary",
        "valuation": "Inventory Valuation Report"
    }

    report_title = title_map.get(type, "Business Performance Report")

    # Title label on right
    c.setFont("Helvetica-Bold", 14)
    c.drawRightString(page_width - 40, page_height - 50, report_title.upper())
    c.setFont("Helvetica", 10)
    c.drawRightString(page_width - 40, page_height - 68, f"Generated: {datetime.utcnow().strftime('%d %b %Y')}")

    # ─── BODY CONTENT ─────────────────────────────────────
    c.setFillColor(colors.black)
    c.setFont("Helvetica", 10)
    y = page_height - 130

    if type == "sales":
        sales = db.query(Sale).order_by(Sale.id.desc()).all()
        total_rev = sum(s.total_amount for s in sales)
        
        c.setFont("Helvetica-Bold", 12)
        c.drawString(40, y, "Sales Performance Metrics")
        c.setFont("Helvetica", 10)
        c.drawString(40, y - 20, f"Total Orders: {len(sales)}")
        c.drawString(40, y - 35, f"Total Sales Value: Rs {total_rev:,.2f}")

        # Table header
        table_top = y - 70
        c.setFillColorRGB(0.47, 0.22, 0.93)
        c.rect(40, table_top, page_width - 80, 20, fill=True, stroke=False)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(50, table_top + 6, "Order ID")
        c.drawString(140, table_top + 6, "Customer")
        c.drawString(320, table_top + 6, "Date")
        c.drawString(450, table_top + 6, "Amount")

        c.setFillColor(colors.black)
        c.setFont("Helvetica", 9)
        row_y = table_top - 18
        for i, s in enumerate(sales[:15]): # top 15
            if i % 2 == 0:
                c.setFillColorRGB(0.97, 0.97, 0.99)
                c.rect(40, row_y - 4, page_width - 80, 16, fill=True, stroke=False)
                c.setFillColor(colors.black)
            
            c.drawString(50, row_y, f"SO-2025-{str(s.id).zfill(3)}")
            c.drawString(140, row_y, s.customer.name[:30] if s.customer else "Walk-in Customer")
            c.drawString(320, row_y, s.created_at.strftime("%Y-%m-%d") if s.created_at else "-")
            c.drawString(450, row_y, f"Rs {s.total_amount:,.2f}")
            row_y -= 18

    elif type == "purchases":
        purchases = db.query(Purchase).order_by(Purchase.id.desc()).all()
        total_exp = sum(p.total_amount for p in purchases)
        
        c.setFont("Helvetica-Bold", 12)
        c.drawString(40, y, "Purchase Summary Metrics")
        c.setFont("Helvetica", 10)
        c.drawString(40, y - 20, f"Total Purchase Orders: {len(purchases)}")
        c.drawString(40, y - 35, f"Total Expenditure: Rs {total_exp:,.2f}")

        # Table header
        table_top = y - 70
        c.setFillColorRGB(0.47, 0.22, 0.93)
        c.rect(40, table_top, page_width - 80, 20, fill=True, stroke=False)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(50, table_top + 6, "PO Number")
        c.drawString(140, table_top + 6, "Product")
        c.drawString(280, table_top + 6, "Vendor")
        c.drawString(400, table_top + 6, "Qty")
        c.drawString(450, table_top + 6, "Total Cost")

        c.setFillColor(colors.black)
        c.setFont("Helvetica", 9)
        row_y = table_top - 18
        for i, p in enumerate(purchases[:15]):
            if i % 2 == 0:
                c.setFillColorRGB(0.97, 0.97, 0.99)
                c.rect(40, row_y - 4, page_width - 80, 16, fill=True, stroke=False)
                c.setFillColor(colors.black)
            
            c.drawString(50, row_y, f"PO-2025-{str(p.id).zfill(3)}")
            c.drawString(140, row_y, p.product.name[:24] if p.product else "Unknown Product")
            c.drawString(280, row_y, p.supplier.name[:20] if p.supplier else "Unknown Vendor")
            c.drawString(400, row_y, str(p.quantity))
            c.drawString(450, row_y, f"Rs {p.total_amount:,.2f}")
            row_y -= 18

    elif type == "inventory":
        products = db.query(Product).order_by(Product.stock.asc()).all()
        low_stock = [p for p in products if p.stock <= p.reorder_level]
        
        c.setFont("Helvetica-Bold", 12)
        c.drawString(40, y, "Inventory Health Report")
        c.setFont("Helvetica", 10)
        c.drawString(40, y - 20, f"Total Product Items: {len(products)}")
        c.drawString(40, y - 35, f"Low Stock Alerts: {len(low_stock)}")

        table_top = y - 70
        c.setFillColorRGB(0.47, 0.22, 0.93)
        c.rect(40, table_top, page_width - 80, 20, fill=True, stroke=False)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(50, table_top + 6, "SKU")
        c.drawString(140, table_top + 6, "Product Name")
        c.drawString(320, table_top + 6, "Stock")
        c.drawString(400, table_top + 6, "Reorder Level")
        c.drawString(480, table_top + 6, "Status")

        c.setFillColor(colors.black)
        c.setFont("Helvetica", 9)
        row_y = table_top - 18
        for i, p in enumerate(products[:15]):
            if i % 2 == 0:
                c.setFillColorRGB(0.97, 0.97, 0.99)
                c.rect(40, row_y - 4, page_width - 80, 16, fill=True, stroke=False)
                c.setFillColor(colors.black)
            
            c.drawString(50, row_y, p.sku or f"SKU-{p.id}")
            c.drawString(140, row_y, p.name[:30])
            c.drawString(320, row_y, str(p.stock))
            c.drawString(400, row_y, str(p.reorder_level))
            
            if p.stock == 0:
                status_lbl = "OUT OF STOCK"
            elif p.stock <= p.reorder_level:
                status_lbl = "LOW STOCK"
            else:
                status_lbl = "OK"
            c.drawString(480, row_y, status_lbl)
            row_y -= 18

    else:
        sales = db.query(Sale).all()
        purchases = db.query(Purchase).all()
        products = db.query(Product).all()

        total_rev = sum(s.total_amount for s in sales)
        total_exp = sum(p.total_amount for p in purchases)
        net_profit = total_rev - total_exp
        total_val = sum(p.stock * p.price for p in products)

        c.setFont("Helvetica-Bold", 12)
        c.drawString(40, y, "Financial & Valuation Statements Summary")
        c.setFont("Helvetica", 10)
        
        c.drawString(40, y - 30, "A. REVENUE SUMMARY")
        c.drawString(50, y - 45, f"All-Time Sales Revenue: Rs {total_rev:,.2f}")
        c.drawString(50, y - 60, f"Total Completed Bills: {len(sales)}")

        c.drawString(40, y - 90, "B. EXPENDITURE SUMMARY")
        c.drawString(50, y - 105, f"Total Purchases Cost: Rs {total_exp:,.2f}")
        c.drawString(50, y - 120, f"Total Supplier Orders: {len(purchases)}")

        c.drawString(40, y - 150, "C. NET PROFIT & LOSS")
        c.drawString(50, y - 165, f"Net Profit / Loss amount: Rs {net_profit:,.2f}")
        status_profit = "PROFITABLE" if net_profit >= 0 else "LOSS ENCOUNTERED"
        c.drawString(50, y - 180, f"Performance Status: {status_profit}")

        c.drawString(40, y - 210, "D. INVENTORY VALUATION")
        c.drawString(50, y - 225, f"Total Catalog Value: Rs {total_val:,.2f}")
        c.drawString(50, y - 240, f"Total Products count: {len(products)}")

    # ─── FOOTER ───────────────────────────────────────────
    c.setFillColorRGB(0.047, 0.039, 0.145)
    c.rect(0, 0, page_width, 40, fill=True, stroke=False)
    c.setFillColor(colors.white)
    c.setFont("Helvetica", 9)
    c.drawCentredString(page_width / 2, 24, "RetailFlow ERP Reports Summary | smart-retail.erp")
    c.drawCentredString(page_width / 2, 12, "This is an auto-generated statement compiled from live operational database records.")

    c.save()

    return FileResponse(
        path=pdf_file,
        media_type="application/pdf",
        filename=f"Report-{type}-{datetime.utcnow().strftime('%Y%m%d')}.pdf"
    )