import express from 'express'
import { callOpenAI, getUserChat } from './chat.js'
import cors from 'cors'

const app = express()

app.use(express.json())

app.use(express.static("public"))

app.use(cors());

// Node express server met POST request
app.post('/api/chat', async (req, res) => {
    const { prompt, userId } = req.body

    try {
        const result = await callOpenAI(userId, prompt)
        res.json(result)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to generate a response." })
    }
})

app.post('/api/history', async (req, res) => {
    const { userId } = req.body
    res.json(getUserChat(userId))
})

app.listen(3000, () => {
    console.log("Server is running on port 3000")
})