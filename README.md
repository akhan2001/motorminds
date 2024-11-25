# **Workshop Manuals Scraper and AI Integration**

A Python-based project that scrapes automotive workshop manual data from `workshop-manuals.com` and integrates Azure AI for intelligent processing and querying.

---

## **Table of Contents**
1. [Introduction](#introduction)
2. [Features](#features)
3. [Technologies Used](#technologies-used)
4. [Setup Instructions](#setup-instructions)
5. [How It Works](#how-it-works)
6. [File Structure](#file-structure)
7. [Use Cases](#use-cases)
8. [Contributing](#contributing)
9. [License](#license)
10. [Acknowledgments](#acknowledgments)

---

## **Introduction**

This project is a two-part system that scrapes vehicle model and repair manual data from `workshop-manuals.com` and integrates Azure AI services to analyze and provide insights using a Retrieval-Augmented Generation (RAG) workflow. The goal is to create a powerful tool for accessing structured automotive data.

---

## **Features**
- Scrape vehicle brands and models from `workshop-manuals.com`.
- Recursively fetch all links and details for specific vehicle brands.
- Store data in JSON format for easy querying and AI integration.
- Utilize Azure AI for intelligent insights using the scraped data.
- Modular codebase for scraping and AI workflows.

---

## **Technologies Used**
- **Python**: Core programming language.
- **BeautifulSoup**: Web scraping library for parsing HTML content.
- **Requests**: For handling HTTP requests.
- **Azure OpenAI**: AI service for querying and processing data.
- **JSON**: Data storage and exchange format.

---

## **Setup Instructions**
1. Clone this repository:
   ```bash
   git clone https://github.com/your-username/workshop-manuals-scraper.git
   cd workshop-manuals-scraper
