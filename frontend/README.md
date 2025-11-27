Inventory Dashboard - Frontend Demo

What this is

- A lightweight React single-file demo that runs in the browser without a build step.
- Stores inventory data in localStorage (no backend yet).
- Provides search, low-stock filtering, add/edit products, adjust stock, and a mock SNS alert flow.

How to run

1. Open `frontend/index.html` in a modern browser (Chrome, Edge, Firefox).
2. The app will load sample data automatically. Use "Reset Sample Data" to restore samples.

Demo scenarios

- View items with low stock (red badge). Use "Show low only" to filter.
- Click "+ Add" or "- Remove" to change quantities; actions record history.
- Click "Send" in the Alerts panel or "Send Alerts for All Low" to simulate sending SNS notifications (mocked).

New features added:

- Product contact and automatic alert option: when adding or editing a product you can set a contact (phone or email) and enable "Send automatic alert when below threshold". When a product's quantity crosses the threshold the demo will simulate sending a notification (mock) and record an alert in the product history.
- History modal: each product card has a "History" button to view the full history (sales/restocks/alerts) for that product.

Next steps (backend integration)

- Replace localStorage operations with API calls to API Gateway + Lambda.
- Implement SNS publishing in backend Lambdas and wire to Cognito-authenticated users.
- Host the built frontend in AWS Amplify and enable Cognito sign-in flows.

Notes

This is the first deliverable (frontend). After you review, I'll implement the backend stubs and the AWS integration steps.
