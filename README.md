# LLM F1 Quiz

Een Formula 1 quiz-app met een vanilla JavaScript frontend, een Express backend en Azure OpenAI via LangChain.

## Vereisten

- Node.js 20 of nieuwer
- npm
- Een geldig Azure OpenAI account en deployment

## Installatie

1. Open een terminal in de projectmap.
2. Installeer de dependencies.

```powershell
npm install
```

3. Maak een `.env` bestand in de projectroot met je Azure OpenAI instellingen.

```env
NODE_ENV=development
AZURE_OPENAI_API_VERSION=...
AZURE_OPENAI_API_INSTANCE_NAME=...
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_API_DEPLOYMENT_NAME=...
AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME=...
```

4. Start de applicatie.

```powershell
npm start
```

5. Open de app in je browser.

```text
http://localhost:3000
```

## Wat de app doet

- Serveert de frontend uit `public/`
- Biedt een quiz via `POST /api/chat`
- Houdt chatgeschiedenis per gebruiker bij in het geheugen van de server

## Bestanden

- `server.js` - Express server en API routes
- `chat.js` - Azure OpenAI integratie en chatgeschiedenis
- `systemPrompt.js` - quiz-instructies voor het model
- `public/index.html` - interface markup
- `public/app.js` - frontend logica
- `public/style.css` - styling

## App live zetten

Als je de app live zet op een Ubuntu-server, laat dan het Node-proces draaien in bijvoorbeeld `screen`, en zet Nginx als reverse proxy voor poort 3000. Gebruik daarna Certbot om HTTPS in te schakelen.

