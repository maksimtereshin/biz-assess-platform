#  Product Specification
## [PRD-1] Introduction & Vision
This document outlines the requirements for a business self-assessment tool delivered through a Telegram bot and an integrated web application.

The core problem this product solves is providing business owners with an accessible and structured way to evaluate their own business across key operational areas. Users can quickly perform a high-level "express" audit or a more comprehensive "full" audit.

The vision is to create a seamless user journey starting from a familiar platform (Telegram) that leads to a rich, interactive survey experience. The product will offer immediate value through a free summary report, with a clear path to upgrade to a paid, detailed analysis, creating a freemium model that encourages adoption and monetization.

## [PRD-2] Target Audience & User Personas
The primary target user for this product is a business owner or entrepreneur who is actively looking to identify strengths and weaknesses within their company's operations. These users are likely familiar with using mobile applications and services like Telegram for communication and business purposes.

## [PRD-3] User Stories / Use Cases
### [PRD-4] Survey Initiation and Completion
[PRD-5] As a new user, I want to start a survey directly from Telegram so that I can easily begin assessing my business. 

[PRD-6] As a user, I want to choose between an "Express" survey and a "Full" survey so that I can select the depth of analysis that suits my current needs and available time. 

[PRD-7] As a user, I want to answer questions one at a time on a simple 1-10 scale so that the process is focused and not overwhelming. 

[PRD-8] As a user, I want to see my progress through the categories and subcategories of the survey so that I understand how much I have completed and what is remaining. 

[PRD-9] As a user, I want my answers to be saved automatically after each question so that I can pause and resume the survey at any time without losing my progress. 

### [PRD-10] Reporting and Payment
[PRD-11] As a user, I want to receive a free summary report immediately after completing a survey so that I can get high-level insights into my business performance. 

[PRD-12] As a user, I want the option to purchase a full, detailed report so that I can gain a deeper understanding of my business's performance across all subcategories. 

[PRD-13] As a user, I want to pay for premium features using Telegram Payments for a fast and secure transaction within the app I'm already using. 

### [PRD-14] History and Repetition
[PRD-15] As a user, I want my first survey to be free so that I can experience the full value of the service without initial commitment. 

[PRD-16] As a returning user, I want to purchase the ability to retake a survey so that I can track my business's progress over time. 

[PRD-17] As a user, I want to access a history of all my completed surveys and download their corresponding reports from the Telegram bot so that I can review my past results. 

### [PRD-18] Engagement and Support
[PRD-19] As a user, I want to receive a unique referral code to share with friends so that I can earn rewards, such as a free survey. 

[PRD-20] As a user, I want to access a Frequently Asked Questions (FAQ) section within the bot to find answers to common questions. 

## [PRD-21] Functional Requirements
### [PRD-22] General Flow
[PRD-23] The user journey begins and is managed through a Telegram bot. 

[PRD-24] The bot serves as the entry point for starting surveys, viewing historical reports, accessing the referral program, and viewing the FAQ. 

[PRD-25] User authentication is handled implicitly by linking data to the user's unique Telegram ID. The web application will not have a separate login or registration system. 

### [PRD-26] Survey Structure
[PRD-27] The system must support two distinct types of surveys. 

#### [PRD-28] Full Survey
[PRD-29] Consists of 7 main categories: Product, Marketing, Sales, HR, Automation and Technology, Metrics and Analytics, and Competency Map. 

[PRD-30] Contains 20 subcategories, including Product Line, Personal Brand, Customer Journey Map, Strategy and Funnels, Promotion Channels, Automation, Sales Organization, Delegation, AI Technology Implementation, and others. 

[PRD-31] Comprises a total of 96 specialized questions. 

#### [PRD-32] Express Survey
[PRD-33] Consists of 6 main categories. 

[PRD-34] TODO: Clarify the 6 categories for the Express survey. The source material lists 7 ("Продукт, Маркетинг, Продажи, HR (кадры), Автоматизация и технологии, Метрики и аналитика, Карта компетенций") but states the total is 6. Options: 1. Confirm the list of 7 is correct and the number "6" is a typo. 2. Provide the correct list of 6 categories by removing one from the provided list. 3. Confirm a different, correct list of 6 categories. 

[PRD-35] Contains 17 subcategories, including Product Line, Personal Brand, Monetization, Customer Avatar, Strategy and Funnels, Promotion Channels, Delegation, Economics, Sales Organization, Sales Funnel, Automation, AI Technology Implementation, Metrics, Professional, Social, etc. 

[PRD-36] Comprises a total of 60 specialized questions. 

### [PRD-37] Web App Survey Experience
[PRD-38] Surveys must be presented to the user within a web application launched from the Telegram bot. 

[PRD-39] Questions shall be displayed one at a time on a single page. 

[PRD-40] Users must not be able to navigate back to previously answered questions. 

[PRD-41] The user's answer for each question must be automatically saved upon submission. 

[PRD-42] The user interface must display the user's overall progress. This should include two progress indicators: one for overall category completion and one for subcategory completion. 

[PRD-43] If a user leaves and returns to an incomplete survey, they must be able to resume from the exact question where they left off. 

### [PRD-44] Scoring and Analytics
[PRD-45] Each survey question must be answered using a rating scale from 1 to 10. 

[PRD-46] The system must calculate an average score for each category and subcategory and present it as a percentage. 

[PRD-47] The calculation must use the following formula: 

[PRD-48]
```latex
Average Percentage = ((Sum of all ratings / Number of questions) - 1) / 9 * 100%
```

### [PRD-49] Report Generation and Access
[PRD-50] Upon survey completion, the system must generate a report. 

[PRD-51] Reports must be available for download in PDF format. 

[PRD-52] Reports must include data visualizations in the form of pie charts. 

[PRD-53] The system must provide two versions of the report based on payment status. 

#### [PRD-54] Free Report
[PRD-55] Includes summary analytics for each main category. 

[PRD-56] Excludes detailed analytics for subcategories. 

[PRD-57] Exception: The "HR" category must always be presented with full, detailed analytics (including all its subcategories), even in the free version, to serve as a sample of the premium content. 

#### [PRD-58] Paid (Full) Report
[PRD-59] Includes comprehensive, detailed analytics for all categories and all of their respective subcategories. 

### [PRD-60] Monetization and Payments
[PRD-61] The system will use Telegram Payments to handle all transactions. 

[PRD-62] Payment is required to unlock a full, detailed report for a completed survey. 

[PRD-63] A user's first-ever survey is free. 

[PRD-64] To retake a survey (either type), a user must make a payment. 

[PRD-65] The Telegram bot must check a user's history to determine if a survey attempt should be free or paid. 

[PRD-66] When presenting a free report, a clear call-to-action button to "Buy Full Version" must be displayed. 

[PRD-67] TODO: Define the pricing structure. Options: 1. A single flat fee for unlocking any full report and another flat fee for any survey retake. 2. Different prices for Express vs. Full reports/retakes. 3. A subscription model for unlimited surveys. Please specify the exact costs. 

### [PRD-68] User Data and History
[PRD-69] The system must store all user survey responses. 

[PRD-70] The system must store relevant metadata for each survey session, including the user's Telegram ID, survey type (Express/Full), completion timestamp, and payment status. 

[PRD-71] Through the Telegram bot, users must be able to view a list of their historical surveys. 

[PRD-72] From the history view, users must be able to download any previously generated report (free or paid version, depending on its status). 

### [PRD-73] Referral Program
[PRD-74] The system must generate a unique referral code for each user. 

[PRD-75] Users can share this code to earn a free survey. 

[PRD-76] TODO: Define the rules for the referral program. Options: 1. The referrer receives one free survey credit for every new user who completes their first survey using the code. 2. The referrer receives one free survey credit only after a specific number of new users (e.g., 3 or 5) have completed their first survey. 3. Both the referrer and the new user receive a benefit (e.g., a free survey for the referrer, a discount for the new user). 

### [PRD-77] Bot Commands
[PRD-78] The Telegram bot must present the user with the following main options: 

[PRD-79] Start Survey: Prompts the user to select either "Express" or "Full". 

[PRD-80] View Reports: Shows the user their survey history for report downloads. If a report has an unpaid full version, it should present an option to pay. 

[PRD-81] Referral Program: Provides the user with their unique code and instructions. 

[PRD-82] FAQ: Displays answers to frequently asked questions. 

[PRD-83] TODO: Provide the content for the FAQ section. This should include common questions about the survey process, payment, report access, and the referral program. 

## [PRD-84] Non-Functional Requirements (Business Perspective)
### [PRD-85] Usability
[PRD-86] The transition from the Telegram bot to the web application must be seamless and instant for the user. 

[PRD-87] Any system errors encountered by the user in the web app (e.g., failure to save an answer due to lost connectivity) should be communicated through passive, non-intrusive messages on the screen. 

### [PRD-88] Reliability
[PRD-89] The auto-save functionality is critical and must reliably store user progress to prevent data loss and user frustration. 

[PRD-90] The system must maintain accurate records of user survey history and payment status. 

### [PRD-91] Performance
[PRD-92] The web application should load quickly, and the transition between questions should feel instantaneous to the user. 

[PRD-93] Report generation should not take more than a few seconds. 

## [PRD-94] Scope
### [PRD-95] In Scope (MVP)
[PRD-96] A fully functional Telegram bot with commands for starting surveys, viewing reports, referral code generation, and a placeholder for an FAQ. 

[PRD-97] A web application that delivers both Express and Full surveys with the one-question-per-page flow and auto-save. 

[PRD-98] PDF report generation with pie charts, correctly implementing the free vs. paid content logic. 

[PRD-99] Integration with Telegram Payments for purchasing full reports and survey retakes. 

[PRD-100] A database to store all user data, survey responses, and metadata. 

[PRD-101] A system for tracking a user's first free survey and enforcing payment for subsequent retakes. 

### [PRD-102] Out of Scope (MVP)
[PRD-103] An administrative back-office or dashboard for managing survey questions, categories, users, or viewing aggregated analytics. All survey content is considered fixed for the initial release. 

[PRD-104] Fully defined and implemented reward logic for the referral program (beyond code generation and basic tracking). 

[PRD-105] Multi-language support. 

## [PRD-106] Success Metrics
[PRD-107] User Engagement: Number of surveys initiated and completed daily (segmented by Express vs. Full). 

[PRD-108] Monetization: 

[PRD-109] Conversion Rate: Percentage of users who purchase the full report after completing a free survey. 

[PRD-110] Repurchase Rate: Number of users who pay to retake a survey. 

[PRD-111] Growth: Number of new users acquired through the referral program. 

## [PRD-112] Assumptions & Dependencies
### [PRD-113] Assumptions
[PRD-114] Users will have a functional Telegram account with Telegram Payments enabled and configured. 

[PRD-115] The structure and content (questions, categories, subcategories) of the Express and Full surveys are finalized and will not change for the MVP. 

[PRD-116] The business logic for calculating analytics is correct and meets the business need. 

### [PRD-117] Dependencies
[PRD-118] The product's functionality is entirely dependent on the availability and stability of the Telegram Bot API and the Telegram Payments API. Any outage or change in these third-party services will directly impact the product. 
