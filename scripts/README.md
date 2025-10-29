# MotorMinds Services Migration - Quick Guide

## 📋 What You Need

1. **Node.js** installed on your computer
2. **Your services data** in `services.txt` (already provided)
3. **Your shop ID** (UUID format)

## 🚀 Quick Steps

### Step 1: Prepare Your Data
Your `services.txt` file is already ready with 247 automotive services in the format:
```
SERVICE NAME<TAB>TAX%<TAB>PRICE<TAB>ACTION
```

**Note:** Negative prices (like -10) are treated as discounts/coupons.

### Step 2: Run the Migration
Open terminal/command prompt in the `scripts` folder and run:

```bash
# With your shop ID
node migrate-services.js your-shop-id-here

# Or with default shop ID
node migrate-services.js
```

### Step 3: Get Your CSV File
The script will create `output/work-order-templates.csv` with all your services ready for import.

### Step 4: Import to MotorMinds
1. Open the CSV file in Excel/Google Sheets to review
2. Import into your MotorMinds database
3. Verify templates appear in your dashboard

## 📊 What You'll Get

- **247 services** automatically categorized
- **4 item types**: labor, parts, services, fees
- **13 categories**: engine, brakes, suspension, electrical, etc.
- **Smart pricing** with cost calculations
- **Labor hour estimates** for complex services

## 🎯 Example Output

```
🚀 MotorMinds Services Migration
===============================
Shop ID: 12345678-1234-1234-1234-123456789012

📊 Parsed 247 services
📄 CSV file generated: output/work-order-templates.csv

📈 Summary:
Total Services: 247

By Type:
  labor: 156
  part: 45
  service: 32
  fee: 14

By Category:
  engine: 67
  brakes: 34
  suspension: 28
  ...

✅ CSV file ready for import!
```

## 🔧 Troubleshooting

**"services.txt not found"**
- Make sure `services.txt` is in the same folder as `migrate-services.js`

**"Node.js not found"**
- Install Node.js from https://nodejs.org

**CSV file is empty**
- Check that `services.txt` has the correct format (tab-separated)

## 📁 Files Created

- `output/work-order-templates.csv` - Your import file
- `output/` folder - Contains all generated files

That's it! Your services are now ready to import into MotorMinds. 🎉
