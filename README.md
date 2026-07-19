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

The project is configured as an `openai-agents-sdk` Makers Agent. Start by
linking this repository to the Agent project created/imported from the Makers
console's **Agents** tab, then use the Makers development server:

```bash
edgeone makers link
edgeone makers dev
```

`makers dev` serves both the Web app and Agent on the same port. Running only
`npm run dev` does not provide the Makers Agent runtime or its built-in model.
Deploy through the connected Git repository (recommended), or with the CLI:

```bash
edgeone makers deploy -n <project-name>
```

New Makers Agent projects use the built-in Makers Models by default. You do
not need to create `AI_GATEWAY_API_KEY` in the Functions console for that path.
For an existing Makers project, keep the `AI_GATEWAY_*` declarations in
`.env.example`; current EdgeOne CLI versions provision and sync the built-in
gateway credentials during Agent initialization/development.
Only when switching to a native/custom model provider should you configure
`AI_GATEWAY_BASE_URL`, `AI_GATEWAY_API_KEY`, and `AI_GATEWAY_MODEL` in the
Makers project environment settings.

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
