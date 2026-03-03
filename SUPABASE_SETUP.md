# Supabase Database Setup

To set up the database for your AI-Queryable Portfolio, follow these steps:

1.  **Open your Supabase Dashboard**: Go to [supabase.com](https://supabase.com) and select your project.
2.  **Open the SQL Editor**: Click on the "SQL Editor" tab in the left sidebar.
3.  **Create a New Query**: Click "New query".
4.  **Copy and Paste the Schema**: Copy the contents of the `supabase_schema.sql` file in this project and paste it into the SQL Editor.
5.  **Run the Query**: Click the "Run" button.

### 6. Security & Public Views
The schema includes **Row Level Security (RLS)** and **Public Views** to protect sensitive data:
- **Admin Access**: Authenticated users have full access to all tables.
- **Public Access**: Anonymous users can only read from `_public` views (e.g., `candidate_profile_public`).
- **Sensitive Data**: Fields like `email`, `salary`, and `honest_notes` are excluded from public views but remain accessible to the AI via Edge Functions.

### 7. Deploy the Edge Function
To power the AI chat with full database context, deploy the `chat` function:
1.  **Install Supabase CLI** locally if you haven't.
2.  **Login**: `supabase login`
3.  **Link Project**: `supabase link --project-ref your-project-ref`
4.  **Set Gemini API Key**: 
    ```bash
    supabase secrets set GEMINI_API_KEY=your_actual_key_here
    ```
5.  **Deploy**:
    ```bash
    supabase functions deploy chat --no-verify-jwt
    supabase functions deploy analyze-jd --no-verify-jwt
    ```
    *(Note: `--no-verify-jwt` is used here for simplicity in a public portfolio, but you can enable it and pass the anon key if preferred.)*

### Tables Created:
- `candidate_profile`: Core profile information.
- `experiences`: Detailed work history with private AI context.
- `skills`: Skills matrix with self-ratings and evidence.
- `gaps_weaknesses`: Honest assessment of areas for growth.
- `values_culture`: Preferences and behavioral traits.
- `faq_responses`: Common questions and answers.
- `ai_instructions`: Guidelines for the AI assistant's personality and boundaries.

### Security:
- **Row Level Security (RLS)** is enabled on all tables.
- **Public Read Access** is configured so the portfolio can fetch your data without authentication.
- **Write Access**: By default, no one can write to these tables. You should use the Supabase Dashboard to add data or set up authentication for an admin panel later.
