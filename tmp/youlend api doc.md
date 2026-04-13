Introduction to APIs
Get started with YouLend's embedded finance APIs. Learn about authentication, environments, integration options, and common use cases to unlock new revenue streams with cash advances and instant settlement solutions.

YouLend’s API platform empowers partners to embed merchant financing on their own terms. Craft tailored solutions, own the customer experience end-to-end, and deliver fast, reliable funding through YouLend’s proven platform.

Getting Started
📘
New to embedded finance? Check out our Terminology Guide to understand the key concepts and definitions used throughout our platform and documentation.

Quick Start Options
Choose your integration approach based on your development resources and desired user experience:

Embedded Components
Ready-to-use UI components that seamlessly integrate into your existing platform with minimal development effort.

Partner Hosted
Users complete applications on your platform, then redirect to YouLend for offer review and contract signing.

Fully Embedded
Complete white-label experience where users never leave your platform throughout the entire funding journey.

Core API Endpoints
Our comprehensive API suite covers every aspect of the embedded finance journey:

Prequalification
Quick eligibility checks - Assess merchant eligibility and get preliminary loan offers with minimal data requirements.

Preapproval
Generate pre-approved offers - Create binding loan offers with detailed payment data for qualified merchants.

Onboarding
Complete application process - Submit and manage funding applications with KYC documents and merchant verification.

Fast Track
Streamlined funding - Expedited approval process for merchants with pre-established relationships and verified data.

Third Party Loan
Loan management - Access loan information, repayment details, documents, and status updates for funded merchants.

Instant Settlement
Real-time transactions - Handle instant settlement transactions and manage accelerated payout services.

Authentication & Environments
All API requests require authentication using API keys. For complete setup instructions and environment details, see our Authentication Guide.

Development Resources
Postman Collection
Complete API collection for testing endpoints and understanding request/response formats.

Webhooks Guide
Set up real-time notifications for application status updates, funding events, and settlements.

Next Steps
Ready to get started? Here's your roadmap:

Review the Guide to understand YouLend's products and integration options
Set up authentication using our Authentication Guide
Choose your integration approach based on your technical requirements
Make your first API call using our interactive documentation
Test the complete flow from application to funding in sandbox
Go live with production credentials and real transactions
Authentication
👋
Please get in touch
If you would like access to our staging environment to begin interacting with our APIs, please get in touch with your implementation manager, or at partnershipmanagement@youlend.com so we can provide you with API credentials

YouLend uses the Client Credentials flow from OAuth 2.0 to secure the API endpoints.

To request an access token for any of the APIs, perform a POST operation to one of the following endpoints:

Location	Staging URL	Production URL
Europe	https://youlend-stag.eu.auth0.com/oauth/token	https://youlend.eu.auth0.com/oauth/token
USA	https://youlend-stag.eu.auth0.com/oauth/token	https://youlend-us.us.auth0.com/oauth/token
The payload of the request should be in the following format:

cURL

curl --request POST \
--url 'https://youlend-stag.eu.auth0.com/oauth/token' \
--header 'content-type: application/json' \
--data grant_type=client_credentials \
--data client_id=YOUR_CLIENT_ID \
--data client_secret=YOUR_CLIENT_SECRET \
--data audience=API_IDENTIFIER
The data audience is relating to the identifier of the API you want to interact with. See below for the URLs to provide against this field.

Europe audience URLs
Identifier	Staging audience URL	Production audience URL
Onboarding	https://staging.youlendapi.com/onboarding	https://youlendapi.com/onboarding
Notification	https://staging.youlendapi.com/notification	https://youlendapi.com/notification
Prequalification	https://staging.youlendapi.com/prequalification	https://youlendapi.com/prequalification
Loan	https://staging.youlendapi.com/loan	https://youlendapi.com/loan
Preapproval	https://staging.youlendapi.com/preapproval	https://youlendapi.com/preapproval
USA audience URLs
Identifier	Staging audience URL	Production audience URL
Onboarding	https://staging.youlendapi.com/onboarding	https://youlendapi.us/onboarding
Notification	https://staging.youlendapi.com/notification	https://youlendapi.us/notification
Prequalification	https://staging.youlendapi.com/prequalification	https://youlendapi.us/prequalification
Loan	https://staging.youlendapi.com/loan	https://youlendapi.us/loan
Preapproval	https://staging.youlendapi.com/preapproval	https://youlendapi.us/preapproval
The successful response (200) contains a signed JSON Web Token (JWT), the token's type (which is Bearer), and in how much time it expires in Unix time (86400 seconds, which means 24 hours).

JSON

{
  "access_token":"eyJz93a...k4laUWw",
    "token_type":"Bearer",
      "expires_in":86400
}
🚧
Be aware
Tokens are valid for 24 hours. Please wherever possible store a token each day and re-use it instead of requesting multiple tokens per day. You can use the expires in property to help you manage this

Your application must pass the retrieved Access Token as a Bearer token in the Authorisation header of all API requests. For example:

cURL

curl -X POST "https://partners.staging-youlendapi.com/onboarding/leads"
-H 'authorization: Bearer ACCESS_TOKEN' \
-H "accept: application/json"
-H "Content-Type: application/json"
-d "REQUEST_DATA"
👍
Try it out
You can also add the bearer token for an API directly in the API reference for each endpoint next to the Try it button to try API requests without leaving this site

Environments
YouLend is available in various countries globally, visit Global coverage to see the full list of countries we are live in.

Today, we have two production environments in order to fulfil regulatory and latency requirements, one for Europe and one for North America.

Our APIs are designed to work globally, which means that once a partner is live in one geography, there is little technical work required to add additional geographies.

Base URLs
Environment	Base URL
Europe (staging)	https://partners.staging-youlendapi.com
Europe (production)	https://youlendapi.com
USA (staging)	https://uspartners.staging-youlendapi.com
USA (production)	https://youlendapi.us

📘
Good to know
Whilst the APIs are very similar from country to country, some countries may have additional parameters

We've seen partners complete the development work to add additional geographies in less than a week

Updated 9 months ago

Authentication
Terminology
Did this page help you?
Terminology
Comprehensive glossary of key terms and definitions used throughout the YouLend API ecosystem, covering business entities, cash advance terms, application processes, and technical concepts.

This page provides a comprehensive glossary of key terms and definitions used throughout the YouLend API ecosystem. Understanding these terms is essential for successful integration and operation within the YouLend platform.

📘
Cash Advances vs. Loans: In most cases and jurisdictions, YouLend provides cash advances structured as revenue-based financing rather than traditional loans. While the API documentation may use "loan" terminology for simplicity and familiarity, the underlying financial product is typically a cash advance, where repayment is linked to a percentage of daily card sales. This distinction is legally important in certain jurisdictions, as traditional lending regulations may not apply to revenue-based financing products.

Core Business Entities
Term	Definition	Context
Lead	A customer's application for funding	Primary entity in onboarding process
Lead ID	Unique identifier (GUID/string) for a customer application	Used across our APIs and webhooks for tracking
Third Party Customer ID	Partner's unique identifier for a merchant	External reference maintained by our partner
Merchant	Business entity seeking funding	Core customer type
Borrower	The entity that receives a cash advance	Legal entity responsible for payment
Lending Partner	YouLend's business partner who refers customers	Channel partner in the ecosystem
Significant Person	Key individuals associated with a business (Directors, Beneficial Owners)	Required for KYC compliance
Cash Advance and Funding Terms
Term	Definition	Context
Cash Advance	Revenue-based financing provided to merchant	Core financial product (legally distinct from loans)
Loan	API terminology for cash advance (for simplicity)	Used in documentation but actual product is cash advance
Advance	Alternative term for cash advance	Preferred product terminology
Factor Rate	Multiplier applied to determine total repayment amount	Pricing mechanism (e.g., 1.1 means 10% fee)
Funded Amount	Actual amount disbursed to merchant	What merchant receives
Original Amount	Total amount merchant must repay	Funded Amount × Factor Rate
Current Amount	Outstanding balance remaining	Dynamic value that decreases with payments
Sweep	Percentage of daily sales used for payment	Repayment mechanism (e.g., 10% of daily sales)
Maturity Date	Final date by which advance must be fully repaid	Contract term
Revenue-Based Financing	Financing model where repayment is tied to business revenue	Legal structure of YouLend's cash advances
Sales-Based Repayment (SBR)	Automatic repayment through percentage of daily sales	Primary repayment method for revenue-based financing
Application Process Terms
Term	Definition	Context
Pre-Qualification	Initial eligibility assessment for marketing purposes	Screening mechanism
Pre-Approval	Preliminary approval based on payment data	Offers including amount, duration, and price
Onboarding	Complete process of application, approval, and funding	End-to-end customer journey
Stage 1	Initial application submission phase	First phase of onboarding
KYC (Know Your Customer)	Identity verification and compliance documentation	Regulatory requirement
Credit Risk Check	Assessment of merchant's creditworthiness	Underwriting process
Underwriting	Process of evaluating merchant's eligibility and determining terms for cash advance	Risk assessment and approval decision
Fast Track	Expedited onboarding process for partners owning the underwriting process	Accelerated processing
Document Types
Term	Definition	Context
Bank Statements	Financial records showing account activity	Required for underwriting
Proof of Identity	Documentation verifying individual identity	KYC requirement
Proof of Address	Documentation confirming residential/business address	KYC requirement
Management Accounts	Internal financial statements	Business financial documentation
Payment Data	Transaction history from payment processors	Core underwriting data
Cash Advance Agreement	Legal contract for the funding	Signed contract document
Direct Debit Mandate	Authorization for automatic payments	Payment setup document
Payment and Settlement Terms
Term	Definition	Context
Instant Settlement	Immediate funding against card sales before they have settled	Accelerated funding product
Settlement Cycle	Time period for transaction processing and payment	Operational timeline
MID (Merchant ID)	Payment processor identifier for merchant	Technical identifier
Payment Gateway	Service that processes card transactions	Technology platform
Chargeback	Disputed transaction reversed by card issuer	Risk factor in payments
Refund	Money returned to customer	Transaction adjustment
Transaction Data	Detailed payment processing information	Core data for decision making
Geographic and Regulatory
Term	Definition	Context
Country ISO Code	Three-letter country identifier (e.g., GBR, USA)	Geographic classification
Currency ISO Code	Three-letter currency identifier (e.g., GBP, USD)	Financial denomination
Company Type	Legal structure of business (Ltd, LLC, etc.)	Regulatory classification
SIC Code	Standard Industrial Classification code	Business activity classification
MCC (Merchant Category Code)	Payment industry business classification	Risk categorization
VAT Number	Value Added Tax registration identifier	Tax compliance identifier
Technical and Integration Terms
Term	Definition	Context
Webhook	HTTP callback for real-time notifications	Integration mechanism
Bearer Token	Authorization token for API requests	Authentication method
Embed Token	Temporary token for embedded components	UI integration feature
Application Status Terms
Term	Definition	Context
Stage 1 Incomplete	Initial application not yet submitted	Application status
Stage 1 Submitted	Application submitted for review	Application status
Offers Provided	Cash advance offers generated and presented	Application status
Offer Accepted	Merchant has accepted a cash advance offer	Application status
Contract Signed	Legal agreements have been executed	Application status
Onboarding Complete	Full process finished, ready for funding	Application status
Pending Information	Additional details required from merchant	Application status
Note: This terminology reference is based on the YouLend API documentation and covers the essential concepts used across all platform APIs. While API documentation may use "loan" terminology for familiarity, all YouLend products are revenue-based cash advances. For specific implementation details, refer to the individual API documentation sections.


Updated 4 months ago

Environments
Enum Reference
Did this page help you?
Country ISO Codes
This enumeration lists the supported country identifiers used across YouLend’s APIs. Each value corresponds to a three-letter ISO 3166-1 alpha-3 that uniquely represents a country.

These codes are required when specifying the merchant’s country in API requests, such as in the countryISOCode field of the ThirdPartyOnboardingModel￼ object.

The same set of country values is used across multiple API models and endpoints, even if the field names differ:

Used in:

countryISOCode (string, enum, required) in ThirdPartyOnboardingModel￼ → Defines the merchant’s country when creating a lead.
country (string, enum, required) in PUT /onboarding/Leads/{leadId}/organisationdetails￼ → Defines the merchant's registered country when updating company details.
Value	Description
BEL	Belgium
DEU	Germany
DNK	Denmark
ESP	Spain
FRA	France
GBR	United Kingdom
IRL	Ireland
NLD	Netherlands
POL	Poland
USA	United States of America
Germany
📘
For full country-specific configuration details, including enum values, field formats, and validation rules, refer to the Germany Localisation Guide section.

Value	Description
EGbr	Registered GbR (eGbR)
EK	Registered merchant sole proprietor (e.K.)
Gbr	Civil law partnership (GbR)
GbrOhg	Civil law partnership / general commercial partnership (GbR / OHG)
GmbhUg	Limited liability company / entrepreneurial "mini-GmbH" (GmbH / UG)
Gewerbebetrieb	Trade / commercial business (often sole proprietor)
Kg	Limited partnership (KG)
Ohg	General partnership (OHG)
Create Lead for Germany
Here's a complete example of creating a lead for a German company using the Onboarding API:

JSON

{
  "thirdPartyCustomerId": "DE_CUSTOMER_12345",
  "confirmedCreditSearch": true,
  "countryISOCode": "DEU",
  "loanCurrencyISOCode": "EUR",
  "keyContactName": "Anna Müller",
  "companyType": "GmbhUg",
  "companyName": "Berliner Tech UG",
  "tradingName": "Berliner Tech",
  "companyNumber": "HRB123456",
  "companyWebsite": "https://berlinertech.de",
  "registeredAddress": {
    "line1": "Alexanderstraße 5",
    "city": "Berlin",
    "region": "Berlin",
    "areaCode": "10178",
    "countryISOCode": "DEU"
  },
  "contactPhoneNumber": "+493012345678",
  "contactEmailAddress": "anna.mueller@berlinertech.de",
  "additionalInfo": {
    "youLendSales": "false",
    "language": "de"
  }
}
Response
JSON

{
  "leadId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "leadURL": "string",
  "signUpURL": "string",
  "openBankingURL": "string"
}
The API will return a leadId that you can use for subsequent operations like uploading documents, updating organization details, or retrieving lead status.

Updated 3 months ago

Language Codes
This enumeration lists the supported language codes used across YouLend’s APIs. The value is typically used in the preferredLanguageCode field of onboarding or lead creation requests.

Value	Description
DA	Danish (Denmark)
DE	German (Germany)
EN	English (United Kingdom)
EN_US	English (United States)
ES	Spanish (Spain)
FR	French (France)
NL	Dutch (Netherlands)
NL_BE	Dutch (Belgium)
PL	Polish (Poland)
Increment Types for Offer Grid
This enumeration determines how offer values are rounded and spaced when generating funding options. It is represented by the field regularIncrementTypeForOfferGrid in the YL.Web.Api.ThirdParty.PreApproval.Models.PreApprovalRequestModel.

Value	Description
LoanAmount	Keeps the funded amounts consistent and evenly spaced (e.g., £1,000 → £1,100 → £1,200), while allowing the sweep percentages to vary slightly (e.g., 10%, 10.2%, 10.3%).
Sweep	Keeps the sweep percentages consistent and evenly spaced (e.g., 10%, 10.5%, 11%), while allowing the funded amounts to vary (e.g., £1,000 → £1,070 → £1,150)
Example A - regularIncrementTypeForOfferGrid = LoanAmount
JSON

{
  "merchantIsEligibleForPreApproval": true,
  "loanType": "CashAdvance",
  "preApprovedOffersModel": {
    "thirdPartyCustomerId": "ACME-123",
    "preApprovalId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "interval": 100,
    "regularIncrementTypeForOfferGrid": "LoanAmount",
    "offers": [
      {
        "offerId": "11111111-1111-1111-1111-111111111111",
        "fundedAmount": 1000,
        "originalAmount": 1150,
        "currencyISOCode": "GBP",
        "factorRate": 1.15,
        "sweep": 10.0,
        "daysUntilRepayment": 120,
        "daysUntilMaturity": 180,
        "expirationDate": "2025-12-10T00:00:00Z"
      },
      {
        "offerId": "22222222-2222-2222-2222-222222222222",
        "fundedAmount": 1100,
        "originalAmount": 1265,
        "currencyISOCode": "GBP",
        "factorRate": 1.15,
        "sweep": 10.2,
        "daysUntilRepayment": 120,
        "daysUntilMaturity": 180,
        "expirationDate": "2025-12-10T00:00:00Z"
      },
      {
        "offerId": "33333333-3333-3333-3333-333333333333",
        "fundedAmount": 1200,
        "originalAmount": 1380,
        "currencyISOCode": "GBP",
        "factorRate": 1.15,
        "sweep": 10.3,
        "daysUntilRepayment": 120,
        "daysUntilMaturity": 180,
        "expirationDate": "2025-12-10T00:00:00Z"
      }
    ]
  }
}
Example B - regularIncrementTypeForOfferGrid = Sweep
JSON

{
  "merchantIsEligibleForPreApproval": true,
  "loanType": "CashAdvance",
  "preApprovedOffersModel": {
    "thirdPartyCustomerId": "ACME-123",
    "preApprovalId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "interval": 0.5,
    "regularIncrementTypeForOfferGrid": "Sweep",
    "offers": [
      {
        "offerId": "44444444-4444-4444-4444-444444444444",
        "fundedAmount": 1000,
        "originalAmount": 1150,
        "currencyISOCode": "GBP",
        "factorRate": 1.15,
        "sweep": 10.0,
        "daysUntilRepayment": 120,
        "daysUntilMaturity": 180,
        "expirationDate": "2025-12-10T00:00:00Z"
      },
      {
        "offerId": "55555555-5555-5555-5555-555555555555",
        "fundedAmount": 1070,
        "originalAmount": 1231,
        "currencyISOCode": "GBP",
        "factorRate": 1.15,
        "sweep": 10.5,
        "daysUntilRepayment": 120,
        "daysUntilMaturity": 180,
        "expirationDate": "2025-12-10T00:00:00Z"
      },
      {
        "offerId": "66666666-6666-6666-6666-666666666666",
        "fundedAmount": 1150,
        "originalAmount": 1323,
        "currencyISOCode": "GBP",
        "factorRate": 1.15,
        "sweep": 11.0,
        "daysUntilRepayment": 120,
        "daysUntilMaturity": 180,
        "expirationDate": "2025-12-10T00:00:00Z"
      }
    ]
  }
}

Updated 4 months ago

Language Codes
Type of Person
Did this page help you?
Type of Person
The typeOfPerson field identifies the role a significant person holds within a company. The accepted values differ by region.

Allowed Values
Value	Region
Director	UK & Europe
BeneficialOwner	UK & Europe
DirectorAndBeneficialOwner	UK & Europe
ExecutiveOfficer	USA
ExecutiveOfficerAndOwner	USA
Owner	USA
Updated about 1 month ago

Increment Types for Offer Grid
Postman Collection
Did this page help you?
Postman Collection
Access our complete API collection in Postman to quickly test and integrate with our APIs.

Overview
Get started quickly with our comprehensive Postman collection that includes all API endpoints, example requests and responses, and environment configurations for both sandbox and production environments.

Prerequisites
To use our Postman collection, you'll need:

A Postman account (free at postman.com)
API credentials
Postman desktop app (recommended) or web client
Quick Start
Run in Postman
When you click the button above, you'll be taken to our public Postman workspace. Follow these steps to get started:

Sign in to Postman - You'll need a Postman account
Fork the Collection - Click "Fork" to create a copy of our collection in your own workspace
Select Your Workspace - Choose which workspace to add the collection to (or create a new one)
Start Testing - Once forked, you can begin using the collection with your own API credentials
What's Included
Complete API Coverage - All endpoints organized by functional area
Example Requests - Pre-configured requests with sample data
Authentication Setup - OAuth 2.0 configuration templates
Environment Setup
1. Import the Collection
Click the "Run in Postman" button above or manually import using:

Collection URL: https://www.postman.com/youlend/youlend-api
2. Configure Envrironment Variables
Set up the following variables in your Postman environment:

Variable	Description	Example
base_url	API base URL	https://partners.staging-youlendapi.com
client_id	Your client ID	your_client_id_here
client_secret	Your client secret	your_client_secret_here
audience	API identifier	https://staging.youlendapi.com/onboarding
3. Authentication
Our collection includes pre-request scripts that automatically handle OAuth 2.0 authentication. The access token will be refreshed automatically when needed. For complete setup instructions and environment details, see our Authentication Guide.

Collection Structure
Authentication
The Authentication collection provides pre-configured requests to obtain access tokens for all API domains. Once you have your client credentials (client_id and client_secret), these requests will automatically handle the OAuth 2.0 flow and generate the necessary tokens for each service area:

Onboarding token
Notification token
Prequalification token
Loan token
Preapproval token
This eliminates the need to manually configure authentication for each API domain - simply run the relevant authentication request and the token will be automatically set for use across all related endpoints.

Prequalification
Check merchant eligibility and get pre-qualification offers before starting the full application process.

Prequalification
1-Click Referral
Create lead
Partner Hosted Application
Endpoints for partners who want to host the application process within their own platform or interface.

Create lead
Add significant persons
Submit bank statements (JSON)
Submit bank statements (PDF)
Submit stage 1
Preapproval Solution
This folder contains the endpoints needed to deliver the preapproval solution.

Application Stage
Submit and manage loan applications, including document uploads and application status tracking.

Create lead
Add significant persons
Submit bank statement (JSON)
Submit JSON payment data
Submit account information
Submit stage 1
Pushbacks
Handle and respond to requests for additional information or clarification during the application review process.

Submit a response to pending information
Terminate a lead
Offers and Signing
Retrieve loan offers, accept terms, and manage document signing workflows.

Calculate loan offers
Accept a loan offer
Retrieve the documents to sign for the lead
Sign documents via 'instant signing'
Post Funding
Manage funded loans, including retrieving loan details, accessing settlement account information with account opening letters, and downloading loan documents.

Retrieve a loan by loan id
List settlement details with account opening letter
Retrive a document for a loan
Reporting
Access reporting data for loans and onboarding activities. Includes endpoints to retrieve loan information, repayment details, lead status, and onboarding progress for tracking purposes.

Loans Reporting
List loans with optional filtering
List loans by lead id
List repayment information for a loan
Onboarding Reporting
List leads with filtering applied
Retrieve onboarding details
Retrieve organisation details
Webhooks
Configure and manage webhook subscriptions to receive real-time notifications about loan status changes and events.

Creating a webhook
Get all events
Update webhook subscription
Delete a subscription

Generate a prequalified offer
post
http://partners.staging-youlendapi.com/prequalification/Requests


Generate a prequalified offer for merchant without previous or live funding.

This endpoint returns indicative offers for a merchant in real time. This endpoint can therefore be used either:

As a scheduled bulk job to generate indicative financing offers for all of a partner's merchants, which is then used in marketing
Requested on demand either by a merchant or by a broker/ adviser "click here to request a prequalified offer"
Request body example
JSON

{
        "companyType": "Ltd",
        "countryISOCode": "GBR",
        "loanCurrencyISOCode": "GBP",
        "thirdPartyMerchantId": "abc123",
        "financialData": {
            "paymentData": [
                {
                    "paymentDate": "2024-03-01T10:55:09.307Z",
                    "amount": 100000,
                    "currencyISOCode": "GBP"
                },
                {
                    "paymentDate": "2024-04-01T10:55:09.307Z",
                    "amount": 12000,
                    "currencyISOCode": "GBP"
                },
                {
                    "paymentDate": "2024-05-01T10:55:09.307Z",
                    "amount": 100000,
                    "currencyISOCode": "GBP"
                },
                {
                    "paymentDate": "2024-06-01T10:55:09.307Z",
                    "amount": 12000,
                    "currencyISOCode": "GBP"
                },
                {
                    "paymentDate": "2024-07-01T10:55:09.307Z",
                    "amount": 100000,
                    "currencyISOCode": "GBP"
                },
                {
                    "paymentDate": "2024-08-01T10:55:09.307Z",
                    "amount": 100000,
                    "currencyISOCode": "GBP"
                },
                {
                    "paymentDate": "2024-09-01T10:55:09.307Z",
                    "amount": 12000,
                    "currencyISOCode": "GBP"
                },
                {
                    "paymentDate": "2024-10-01T10:55:09.307Z",
                    "amount": 100000,
                    "currencyISOCode": "GBP"
                },
                {
                    "paymentDate": "2024-11-01T10:55:09.307Z",
                    "amount": 12000,
                    "currencyISOCode": "GBP"
                },
                {
                    "paymentDate": "2024-12-01T10:55:09.307Z",
                    "amount": 100000,
                    "currencyISOCode": "GBP"
                },
                {
                    "paymentDate": "2025-01-01T10:55:09.307Z",
                    "amount": 100000,
                    "currencyISOCode": "GBP"
                },
                {
                    "paymentDate": "2025-02-01T10:55:09.307Z",
                    "amount": 100000,
                    "currencyISOCode": "GBP"
                },
                {
                    "paymentDate": "2025-03-01T10:55:09.307Z",
                    "amount": 100000,
                    "currencyISOCode": "GBP"
                }                
            ]
        }
    }
Parameter callouts
Parameter	Description
companyType	Should match one of the company types seen here . You can learn about which company types are associated with what country in our localisation guides, see the United Kingdom guide as an example
paymentDate	UTC format
amount	This is always returned in dollars/ pounds/ euros. For example, £100 should be sent as 100. This represents the turnover for the payment data.
Response body example
JSON

{
    "thirdPartyMerchantId": "abc123",
    "mid": null,
    "companyName": null,
    "overallCreditRiskScore": 3.8157894736842105263157894737,
    "overrideCreditRiskScore": 0.0,
    "loanOptions": [
        {
            "currencyISOCode": "GBP",
            "fee": 5808.0,
            "fundedAmount": 17600.0,
            "loanAmount": 23408.0,
            "sweep": 20.0
        },
        {
            "currencyISOCode": "GBP",
            "fee": 6440.0,
            "fundedAmount": 18400.0,
            "loanAmount": 24840.0,
            "sweep": 20.0
        },
        {
            "currencyISOCode": "GBP",
            "fee": 7030.0,
            "fundedAmount": 19000.0,
            "loanAmount": 26030.0,
            "sweep": 20.0
        }
    ]
}

Parameter callouts
Parameter

Description

fundedAmount

This value is rounded based on the following logic:

0–10,000 → step 10
10,000–100,000 → step 100
100,000 or higher → step 1000
overrideCreditRiskScore

This value can be ignored, it is deprecated.



Body Params
A YL.Web.Api.ThirdParty.PreQualification.Models.PreQualificationModel

companyType
string
enum
required

Ltd

Show 39 enum values
financialData
object
required
Financial model for receiving offers


financialData object
countryISOCode
string
enum
required

GBR

Show 9 enum values
loanCurrencyISOCode
string
enum
required

GBP
Allowed:

GBP

EUR

PLN

USD
thirdPartyMerchantId
string | null
Gets or sets the third party's id for a merchant.

mid
string | null
Gets or sets the merchant ID

companyName
string | null
Gets or sets the company name

companyNumber
string | null
Gets or sets the company number

companyWebsite
string | null
Gets or sets the company website

contactEmailAddress
string | null
Gets or sets a contact email address for the merchant

sicCode
string | null
Gets or sets the SIC code

mccCode
string | null
Gets or sets the MCC code

monthsTrading
int32
≥ 0
Gets or sets the number of months the merchant has been trading for

significantPersons
array of objects | null
Gets or sets the significant persons of the company (directors)


ADD object
Headers
api-version
string
accept
string
enum
Defaults to application/json
Generated from available response content types


application/json
Allowed:

application/json

application/xml
Responses

200
Returns PreQualificationResultDocument.

Response body

application/json
object
thirdPartyMerchantId
string | null
mid
string | null
companyName
string | null
overallCreditRiskScore
double
overrideCreditRiskScore
double
loanOptions
array of objects | null
object
currencyISOCode
string | null
fee
double
fundedAmount
double
loanAmount
double
sweep
double

400
Bad Request

curl --request POST \
     --url http://partners.staging-youlendapi.com/prequalification/Requests \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
  "companyType": "Ltd",
  "countryISOCode": "GBR",
  "loanCurrencyISOCode": "GBP"
}
'
{
  "thirdPartyMerchantId": "string",
  "mid": "string",
  "companyName": "string",
  "overallCreditRiskScore": 0,
  "overrideCreditRiskScore": 0,
  "loanOptions": [
    {
      "currencyISOCode": "string",
      "fee": 0,
      "fundedAmount": 0,
      "loanAmount": 0,
      "sweep": 0
    }
  ]
}
{
  "type": "string",
  "title": "string",
  "status": 0,
  "detail": "string",
  "instance": "string"
}

Generate a prequalified offer for an existing customer (renewal)
post
http://partners.staging-youlendapi.com/prequalification/Requests/renewal


Generate a prequalified offer for merchant that has previous or live funding.

Body Params
A YL.Web.Api.ThirdParty.PreQualification.Models.RenewalPreQualificationModel

leadId
string
required
length ≥ 1
Gets or sets the leadId for the customer's most recent previous funding

countryISOCode
string
enum
required

GBR

Show 9 enum values
loanCurrencyISOCode
string
enum
required

GBP
Allowed:

GBP

EUR

PLN

USD
paymentData
array of objects
required

ADD object
Headers
api-version
string
accept
string
enum
Defaults to application/json
Generated from available response content types


application/json
Allowed:

application/json

application/xml
Responses

200
Returns RenewalPreQualificationResultDocument.

Response body

application/json
object
leadId
uuid
loanOptions
array of objects | null
object
currencyISOCode
string | null
fee
double
fundedAmount
double
loanAmount
double
sweep
double

400
Bad Request

curl --request POST \
     --url http://partners.staging-youlendapi.com/prequalification/Requests/renewal \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
  "countryISOCode": "GBR",
  "loanCurrencyISOCode": "GBP"
}
'
{
  "leadId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "loanOptions": [
    {
      "currencyISOCode": "string",
      "fee": 0,
      "fundedAmount": 0,
      "loanAmount": 0,
      "sweep": 0
    }
  ]
}
Introduction to Onboarding
Partners can onboard merchants for cash advance via their own user experience powered by YouLend's APIs, or YouLend can host a co-branded experience. This page concerns onboarding a merchant via API.

Partners can choose varying levels of integration with our Onboarding API; they can either submit partial or fully completed applications along with supporting documentation.

Overview
Most integrations with the Onboarding API will cover the following steps:

1. Create Application
Create a financing application (lead) for a merchant

2. Enrich Application
Provide bank statements, directors, and sales data

3. Submit for Decision
Submit the completed lead for automated decisioning

4. Get Decision
Retrieve offers or rejection status from YouLend

5. Accept Offer
Present offers and let merchants choose or customise

6. Sign Contract
Enable merchants to sign via instant signing or DocuSign

1. Create an application (create a "lead")
Create a financing application.

🚧
YouLend expect partners to have adequate justification for sharing personal detail about a merchant and that the merchant has agreed that their personal details will be shared with YouLend and processed in line with YouLend's Privacy Policy and Terms of Service

📘
Partners can use the variable thirdPartyCustomerId to share their own internal customer ID for the merchant, making it easier for partners to match the lead to their internal systems
Partners can use this endpoint alone, at which point either the merchant can be redirected to the signUpURL from the 200 response for them to complete the application, or YouLend can reach out to the applicant to request more information to complete the application
2. Enrich the application to enable a YouLend decision
Provide enough information to YouLend about a merchant that YouLend can provide a decision about whether financing can be offered to the merchant. You will need to ensure that the following minimum information is provided, unless you have agreed otherwise with your YouLend Implementation Manager:

Submit bank statements for the merchant either as files or in JSON format. YouLend requires at least 3 months of history, but if the partner can provide a longer history of data, then YouLend can provide more generous offers.
Submit information about the Directors and Ultimate Beneficial Owners of the business Update significant persons.
Optional Submit information about the merchant's sales with Submit payment data documents or Submit JSON payment data.
📘
Merchants will typically receive the most generous offers when YouLend is provided with more than 12 months' of sales or bank data

If merchant is applying for >£/€100,000: Submit management accounts for the merchant.
Finally, YouLend needs consent from the merchant to perform credit checks which are 'soft' in the sense that they do not impact the credit score of the merchant. In some cases, YouLend may need proof of identity which can be copies of government-issued ID such as passports or driver's license.
3. Submit the lead to YouLend for decisioning
Inform YouLend that the lead is completed, and that YouLend should start the automated decisioning process.

YouLend will return a 200 response when the lead has been successfully submitted. See below for an error response example if YouLend is missing data to review the lead.

Example 400 response
4. Get decision from YouLend (whether approved or rejected)
Retrieve the current decision status of a lead application as determined by YouLend.

A successful response will include details of offers from YouLend, including the funding amount, the fee, and the repayment %. You can show this information to your merchants to allow them to choose whether they want to take the financing from YouLend.

👍
Best practice: Most of our partners are currently using webhooks (event code ONB10011) to be notified of this step, find out more information here

Example Offers provided ONB10011 webhook
📘
The MaxFundingAmount and MinFundingAmount returned in the ONB10011 webhook event are used to calculate flexible offers

5. Enable merchants to accept an offer (including generating flexible offers)
Once the offers have been provided, partners have the option to present the fixed offers to the merchant using their own UI. In addition to this, partners can also allow the merchant to customise their offer by using the calculate loan offers endpoint. The amount requested needs to between the MaxFundingAmount and MinFundingAmount returned in the ONB10011 webhook.

Example 200 response of the calculate loan offers endpoint
Once the merchant has chosen an offer (either using the offers returned in the ONB10011 webhook, or through the generated flexible offer), the partner informs YouLend of the offer accepted by sending a request to the accept a loan offer endpoint using the relevant offerId.

The response will return a boolean to let you know if the merchant is eligible for instant signing, this will be either true or false.

Example 200 response — accept offer
6. Enable merchants to sign an offer either via instant signing (clicksign) or Docusign
📘
Instant signing is only supported in certain geographies and for certain levels of integration, please speak to your integration manager about what is available for your solution. Below is an indicative example

i) Instant signing (clicksign) flow
Enable merchants to review the contract associated with YouLend's offer, and to sign it. There are two endpoints associated with this step:

Retrieve the documents to sign for the lead
The response will include the financial documents ("contracts") that YouLend require the merchant to sign before financing the merchant.

Example 200 response — documents to sign
Sign documents via 'instant signing'
Send a request to this endpoint to inform YouLend that the merchant has signed the contract within your own UI.

🚧
Using this endpoint requires approval from YouLend. There are certain requirements you'll need to meet for (a) how the signing flow is presented to the user, (b) how you manage logins and permissions, and (c) what would count as a robust enough verificationId

👋
Please get in touch
If you would to learn more about who can sign a Loan Agreement, please get in touch via your implementation manager, or via partnershipmanagement@youlend.com

ii) Docusign flow
If the merchant is not eligible for instant signing (see above), YouLend will instead send a contract via to the merchant to review and sign. This process is handled completely by YouLend, and requires no technical work from the partner.

👍
Best practice: We recommend subscribing to the Contract sent ONB10038 and Contract signed ONB10022 webhook event codes to keep track of what steps the merchant has completed. See our webhook events guide to learn more about this

Updated about 1 month ago
Onboarding API Validation
This guide outlines the list of validation rules used in the Create a lead and Update significant persons endpoints. When any of the below validation rules are breached, the API returns a 422 response alongside a json body that contains information on the breached rule(s).

The error response when validation fails on any given property follows the structure below:

JSON

{
    "PropertyNameThatFailedValidation": [
        "message for first rule that failed",
        "message for second rule that failed",
        ...
        "message for n(th) rule that failed",
    ]
}
📘
Good to know: In the example error messages in the tables below, all messages for all the rules have been added (as if all rules were broken at once). When interacting with YouLend's API, you will only receive the error messages for the actually broken rules.

Create a lead
API reference for creating a new lead

Update significant persons
API reference for updating significant persons on a lead

Create a lead validation
The following table lists each property in the Create a lead request body, its validation rules, and the error messages returned when validation fails.

Property	Required	Description
ThirdPartyCustomerId	Yes	Your unique customer identifier (max 50 alphanumeric characters)
CountryISOCode	Yes	ISO 3166 country code
LoanCurrencyISOCode	Yes	Currency code: GBP, EUR, DKK, PLN, or USD
KeyContactName	Yes	Primary contact name (max 255 characters)
CompanyType	Yes	Company legal structure (e.g., soleTrader, limitedCompany)
CompanyName	Yes	Registered company name (2–255 characters)
CompanyWebsite	No	Company URL (max 1000 characters)
TradingName	No	Trading or brand name (1–200 characters)
CompanyNumber	Conditional	Company registration number (format varies by country)
VatNumber	No	VAT registration number (6–14 alphanumeric characters)
Mid	No	Merchant ID (min 7 alphanumeric characters)
MerchantIds	No	List of merchant IDs (alternative to Mid)
ContactPhoneNumber	No	Phone number (8–20 characters)
ContactEmailAddress	No	Email address (max 255 characters)
SignupClientIp	USA only	Client IP address
EmployerIdentificationNumber	USA only	EIN in XX-XXXXXXX format (non-sole traders)
ThirdPartyCustomerId
CountryISOCode
LoanCurrencyISOCode
KeyContactName
CompanyType
CompanyName
CompanyWebsite
TradingName
CompanyNumber
VatNumber
Mid
MerchantIds
ContactPhoneNumber
ContactEmailAddress
SignupClientIp
EmployerIdentificationNumber
Update significant persons validation
The following table lists each property in the Update significant persons request body, its validation rules, and the error messages returned when validation fails.

Property	Required	Description
FirstName	Yes	Person's first name (max 255 characters)
Surname	Yes	Person's surname (max 255 characters)
TypeOfPerson	Yes	Role type (see typeOfPerson enums)
DateOfBirth	Yes	Must be at least 18 years old
Line1, City, AreaCode, Country	Yes	Required address fields (max 255 characters each)
Line2, Line3, Region	No	Optional address fields (max 255 characters each)
FirstName
Surname
TypeOfPerson
DateOfBirth
Line1, City, AreaCode, Country
Line2, Line3, Region
Create a lead.
post
https://partners.staging-youlendapi.com/onboarding/Leads

Create a new application (both for initial applications and renewals).

Notice that the 200 response includes the signUpURL to redirect a merchant to their application in the YouLend hosted journey.

Partners can use the variable thirdPartyCustomerId to share their own internal customer ID for the merchant, making it easier for partners to match the lead to their internal systems.

🚧
Be aware (USA)
In the USA,employerIdentificationNumber param is mandatory
When submitting an Address, the region param is mandatory and must correspond to a valid State (eg. "New York"), or a valid ANSI 2 letter State code (eg. "NY")
📘
Good to know
The companyWebsite parameter is optional but strongly recommended. Including it in the Create Lead request helps YouLend verify the business and significantly reduces the likelihood of pushbacks. Please provide this value whenever possible.

Body Params
A YL.Web.Api.ThirdParty.Onboarding.Models.ThirdPartyOnboardingModel containing the data required to create the lead.

thirdPartyCustomerId
string
required
length ≥ 1
Gets or sets the third party's unique id for a merchant.

companyName
string
required
length between 2 and 200
Gets or sets the merchant's company name.

countryISOCode
string
enum
required
length ≥ 1
Gets or sets the ISO country code for the merchant.


GBR

Show 10 enum values
loanCurrencyISOCode
string
required
length ≥ 1
Gets or sets the ISO currency code for the merchant.

keyContactName
string
required
length between 1 and 255
Gets or sets the key merchant contact who will be applying for the loan.

companyType
string
enum
required
length ≥ 1
Gets or sets the key merchant company type.


Ltd

Show 61 enum values
registeredAddress
object
required
Address Data Model.


registeredAddress object
contactPhoneNumber
string
required
length between 8 and 20
Gets or sets the merchant's contact phone number.

contactEmailAddress
string
required
length between 1 and 255
Gets or sets the merchant's key contact email address.

confirmedCreditSearch
boolean
Gets or sets a value indicating whether the lead has given their consent for a credit search. This parameter has to be true in order for the lead to be able to submit the application (stage 1).


thirdPartyLeadId
string | null
Gets or sets the third party's id for the specific application (lead).

monthlyCardRevenue
double
Gets or sets the monthly card revenue for the merchant.

numberOfPaymentsPerMonth
int32
Gets or sets the number of payments a merchant has each month.

sweepPercentage
double
Gets or sets the percentage of daily sales the merchant wants to use to pay back the loan.

monthsTrading
int32
Gets or sets the number of months the merchant has been trading.

loanAmount
double
Gets or sets the size of loan the merchant wants.

companyWebsite
string | null
Gets or sets the merchants company website URL.

companyNumber
string | null
Gets or sets the registered company number for the merchant.

vatNumber
string | null
Gets or sets the VAT number for the merchant.

mid
string | null
Gets or sets the MID for the merchant.

merchantIds
array of strings | null
Gets or sets the MerchantIds for the merchant if there is more than one.


ADD string
additionalInfo
object | null
Gets or sets a list of key values pairs representing any additional lead data not already covered.


additionalInfo object | null
signupClientIp
string | null
Gets or sets the Ip address of the merchant.

notificationURL
string | null
(DEPRECATED - please see https://docs.youlend.com/reference/webhooks-intro for how to subscribe to notifications).

employerIdentificationNumber
string | null
Gets or sets the merchant's tax identification number (required for USA).

renewal
object
Renewal data model.


renewal object
tradingAddress
object
Address Data Model.


tradingAddress object
tradingName
string | null
Gets or sets the merchant's trading name.

preApprovalId
uuid
Gets or sets the PreApprovalId.

ownerUserId
uuid
Gets or sets the OwnerUserId.

preferredLanguageCode
string | null
enum
Gets or sets the PreferredLanguageCode.



Show 9 enum values
preferredRepaymentMethod
string | null
enum
Gets or sets the preferred repayment method for the merchant. Accepted values: "Sales-Based Repayment", "Direct Debit Fixed".


Allowed:

SBR

DD

SalesBasedRepaymentManagingProcessor
secondaryLendingPartnerDetails
object
Secondary lending partner details model.


secondaryLendingPartnerDetails object
industries
array of objects | null
Gets or sets the Industries.


ADD object
Headers
api-version
string
accept
string
enum
Defaults to application/json
Generated from available response content types


application/json
Allowed:

application/json

application/xml
Responses

200
Returns a CreateThirdPartyAdvanceOnboardingResultModel.

Response body

application/json
object
leadId
uuid
Gets or sets the Lead Id.

leadURL
string | null
Gets or sets the Lead redirect URL.

signUpURL
string | null
Gets or sets the broker redirect URL.

openBankingURL
string | null
Gets or sets the Open Banking Url.


400
Bad Request


404
Not Found

Create a lead.
post
https://partners.staging-youlendapi.com/onboarding/Leads

Create a new application (both for initial applications and renewals).

Notice that the 200 response includes the signUpURL to redirect a merchant to their application in the YouLend hosted journey.

Partners can use the variable thirdPartyCustomerId to share their own internal customer ID for the merchant, making it easier for partners to match the lead to their internal systems.

🚧
Be aware (USA)
In the USA,employerIdentificationNumber param is mandatory
When submitting an Address, the region param is mandatory and must correspond to a valid State (eg. "New York"), or a valid ANSI 2 letter State code (eg. "NY")
📘
Good to know
The companyWebsite parameter is optional but strongly recommended. Including it in the Create Lead request helps YouLend verify the business and significantly reduces the likelihood of pushbacks. Please provide this value whenever possible.

Body Params
A YL.Web.Api.ThirdParty.Onboarding.Models.ThirdPartyOnboardingModel containing the data required to create the lead.

thirdPartyCustomerId
string
required
length ≥ 1
Gets or sets the third party's unique id for a merchant.

companyName
string
required
length between 2 and 200
Gets or sets the merchant's company name.

countryISOCode
string
enum
required
length ≥ 1
Gets or sets the ISO country code for the merchant.


GBR

Show 10 enum values
loanCurrencyISOCode
string
required
length ≥ 1
Gets or sets the ISO currency code for the merchant.

keyContactName
string
required
length between 1 and 255
Gets or sets the key merchant contact who will be applying for the loan.

companyType
string
enum
required
length ≥ 1
Gets or sets the key merchant company type.


Ltd

Show 61 enum values
registeredAddress
object
required
Address Data Model.


registeredAddress object
contactPhoneNumber
string
required
length between 8 and 20
Gets or sets the merchant's contact phone number.

contactEmailAddress
string
required
length between 1 and 255
Gets or sets the merchant's key contact email address.

confirmedCreditSearch
boolean
Gets or sets a value indicating whether the lead has given their consent for a credit search. This parameter has to be true in order for the lead to be able to submit the application (stage 1).


thirdPartyLeadId
string | null
Gets or sets the third party's id for the specific application (lead).

monthlyCardRevenue
double
Gets or sets the monthly card revenue for the merchant.

numberOfPaymentsPerMonth
int32
Gets or sets the number of payments a merchant has each month.

sweepPercentage
double
Gets or sets the percentage of daily sales the merchant wants to use to pay back the loan.

monthsTrading
int32
Gets or sets the number of months the merchant has been trading.

loanAmount
double
Gets or sets the size of loan the merchant wants.

companyWebsite
string | null
Gets or sets the merchants company website URL.

companyNumber
string | null
Gets or sets the registered company number for the merchant.

vatNumber
string | null
Gets or sets the VAT number for the merchant.

mid
string | null
Gets or sets the MID for the merchant.

merchantIds
array of strings | null
Gets or sets the MerchantIds for the merchant if there is more than one.


ADD string
additionalInfo
object | null
Gets or sets a list of key values pairs representing any additional lead data not already covered.


additionalInfo object | null
signupClientIp
string | null
Gets or sets the Ip address of the merchant.

notificationURL
string | null
(DEPRECATED - please see https://docs.youlend.com/reference/webhooks-intro for how to subscribe to notifications).

employerIdentificationNumber
string | null
Gets or sets the merchant's tax identification number (required for USA).

renewal
object
Renewal data model.


renewal object
tradingAddress
object
Address Data Model.


tradingAddress object
tradingName
string | null
Gets or sets the merchant's trading name.

preApprovalId
uuid
Gets or sets the PreApprovalId.

ownerUserId
uuid
Gets or sets the OwnerUserId.

preferredLanguageCode
string | null
enum
Gets or sets the PreferredLanguageCode.



Show 9 enum values
preferredRepaymentMethod
string | null
enum
Gets or sets the preferred repayment method for the merchant. Accepted values: "Sales-Based Repayment", "Direct Debit Fixed".


Allowed:

SBR

DD

SalesBasedRepaymentManagingProcessor
secondaryLendingPartnerDetails
object
Secondary lending partner details model.


secondaryLendingPartnerDetails object
industries
array of objects | null
Gets or sets the Industries.


ADD object
Headers
api-version
string
accept
string
enum
Defaults to application/json
Generated from available response content types


application/json
Allowed:

application/json

application/xml
Responses

200
Returns a CreateThirdPartyAdvanceOnboardingResultModel.

Response body

application/json
object
leadId
uuid
Gets or sets the Lead Id.

leadURL
string | null
Gets or sets the Lead redirect URL.

signUpURL
string | null
Gets or sets the broker redirect URL.

openBankingURL
string | null
Gets or sets the Open Banking Url.


400
Bad Request


404
Not Found

curl --request POST \
     --url https://partners.staging-youlendapi.com/onboarding/Leads \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
  "countryISOCode": "GBR",
  "companyType": "Ltd"
}
'{
  "leadId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "leadURL": "string",
  "signUpURL": "string",
  "openBankingURL": "string"
}
Update significant persons.
put
https://partners.staging-youlendapi.com/onboarding/Leads/{leadId}/significantpersons


Provide information on beneficial owners, directors, and executives.

🚧
Be aware (EUR)
In Europe, at least one Director or DirectorAndBeneficialOwner must be on a lead in order to submit

A Director runs a business but has no ownership interest

A BeneficialOwner owns a business but has no involvement in running the business

A DirectorAndBeneficialOwnerowns and runs a business - this is the most common type for small and medium enterprises.

🚧
Be aware (USA)
In the USA, at least one ExecutiveOfficer or ExecutiveOfficerAndOwner must be on a lead in order to submit

An ExecutiveOfficer runs a business but has no ownership interest

A BeneficialOwner owns a business but has no involvement in running the business

A ExecutiveOfficerAndOwnerowns and runs a business - this is the most common type for small and medium enterprises.

Parameter

Best practice

Good Example

address

Provide the house/flat number and name of the road in line1

"line1": "5 Happy Road"

contactPhoneNumber

Include the telephone country code

"contactPhoneNumber": "+44000000000"

percentageOwned

Ensure the total ownership across all significantPersons does not exceed 100

Person A: "percentageOwned": 60 Person B: "percentageOwned": 40"

placeOfBirth


The format for this param is: {city}, {country}` where country follows the ISO 3166 3 letter code in Country ISO Codes.

London, GBR


Path Params
leadId
uuid
required
The lead id.

Body Params
A significant person model.

significantPersons
array of objects | null
Gets or sets a list of significant persons.


ADD object
Headers
api-version
string
accept
string
enum
Defaults to application/json
Generated from available response content types


application/json
Allowed:

application/json

application/xml
Responses

200
OK

Response body

application/json
object
leadId
uuid
Gets or sets the Lead Id.

significantPersonIds
array of uuids | null
Gets or sets the Significant person ids.


400
Bad Request

