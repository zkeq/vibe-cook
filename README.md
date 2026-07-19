This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Recipe Agent (EdgeOne Makers)

The recipe detail and cooking pages include a context-aware chef Agent. The native
Makers handler lives at `agents/recipe-chef/index.ts`; `edgeone.json` enables the
session runtime, and the client sends a stable `Makers-Conversation-Id` for each
recipe conversation.

Configure these server-side variables in the EdgeOne Makers project:

```bash
AI_GATEWAY_BASE_URL=https://ai-gateway.edgeone.link/v1
AI_GATEWAY_API_KEY=sk-...
AI_GATEWAY_MODEL=@makers/deepseek-v4-flash
```

Run and deploy with the EdgeOne CLI:

```bash
edgeone makers dev
edgeone makers deploy -n <project-name>
```

When the Web app and Agent use separate domains, set
`NEXT_PUBLIC_RECIPE_AGENT_URL=https://<agent-domain>/recipe-chef`. Keep it empty
for a same-domain Makers deployment. Never expose `AI_GATEWAY_API_KEY` with a
`NEXT_PUBLIC_` prefix.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
