<a href="https://www.self.so">
  <img alt="Self" src="./public/og.png">
  <h1 align="center">Self</h1>
</a>

<p align="center">
  An open source personal site builder. Powered by Together.ai.
</p>

## Tech stack

- Together.ai for the LLM
- Vercel's AI SDK as the LLM framework
- Clerk for authentication
- Next.js app router
- Helicone for observability
- S3 for object storage (PDFs)
- Upstash redis for my DB
- Vercel for hosting

## How it works

1. Create an account on the site with Clerk
2. Upload a PDF which gets uploaded to S3 and does a safety check with Llama Guard
3. Send the PDF as context to Qwen Next to extract out relevant information with structured outputs (JSON mode)
4. Get all the information & put it on a dynamic route for the user to be able to view & publish their site

## Cloning & running

1. Fork or clone the repo
2. Create an account at [Together AI](https://togetherai.link/?utm_source=selfso&utm_medium=referral&utm_campaign=example-app) for the LLM
3. Create an account at [Upstash](https://upstash.com/) for the Redis DB
4. Create an account at [AWS](https://aws.amazon.com/) for the S3 bucket
5. Create a `.env` (use the `.example.env` for reference) and replace the API keys
6. Run `pnpm install` and `pnpm run dev` to install dependencies and run locally


### Running Tests Locally

```bash
# Run all tests
pnpm test:run

# Run tests with UI
pnpm test:ui

# Run tests in watch mode
pnpm test
```

## Future tasks

- [ ] add error logging to make sure to fix any bugs
- [ ] add ability to get to the "preview" page if you have a site already
- [ ] ability to edit links in the site
- [ ] ability to edit any section in the site
- [ ] add themes that you can toggle on (start with ghibli)
- [ ] Delete previously uploaded resume when we upload a new one
