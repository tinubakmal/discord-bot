import discord
import requests
import asyncio
import os

TOKEN = os.getenv("TOKEN")
CHANNEL_ID = https://discord.com/channels/1450804817957093378/1485912299288920176

API_URL = "https://codex.fqegg.top/api/tower"

intents = discord.Intents.default()
client = discord.Client(intents=intents)

already_alerted = set()

def get_towers():
    try:
        response = requests.get(API_URL)
        data = response.json()
        
        towers = []
        
        for tower in data:
            name = tower["name"]
            level = str(tower["floor"])
            towers.append((name, level))
            
        return towers

    except Exception as e:
        print("Erreur API :", e)
        return []

async def check_towers():
    await client.wait_until_ready()
    channel = client.get_channel(CHANNEL_ID)

    while True:
        towers = get_towers()

        for name, level in towers:
            if level == "50" and name not in already_alerted:
                await channel.send(f"🔥 {name} est à 50 étages ! GO !")
                already_alerted.add(name)

        await asyncio.sleep(180)

@client.event
async def on_ready():
    print("Bot connecté !")
    client.loop.create_task(check_towers())

client.run(TOKEN)
