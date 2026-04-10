export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  const { marca, rubro, tono, objetivo, plataformas, frecuencia, periodo } = req.body;
  if (!rubro) return res.status(400).json({ error: "El rubro es obligatorio" });

  const dias = periodo === "mensual" ? 30 : 7;
  const postsTotal = frecuencia === "diario" ? dias : frecuencia === "3x" ? Math.round(dias * 3 / 7) : frecuencia === "5x" ? Math.round(dias * 5 / 7) : Math.round(dias * 2 / 7);

  const prompt = `Sos un experto community manager. Creá un plan de contenido de ${dias} días para la siguiente marca:

- Nombre: ${marca || "Sin nombre definido"}
- Rubro: ${rubro}
- Tono de voz: ${tono || "profesional pero cercano"}
- Objetivo principal: ${objetivo || "generar comunidad y ventas"}
- Plataformas: ${plataformas || "Instagram, TikTok"}
- Frecuencia: ${frecuencia || "3x"} por semana
- Total de posts: ${postsTotal}

Generá exactamente ${postsTotal} posts distribuidos a lo largo de ${dias} días.

Respondé SOLO con JSON válido, sin backticks ni texto extra:
{
  "plan": [
    {
      "dia": 1,
      "fecha_relativa": "Lunes semana 1",
      "plataforma": "Instagram",
      "formato": "Reel",
      "tema": "...",
      "objetivo_post": "educar / entretener / vender / conectar / inspirar",
      "angulo": "...",
      "nivel_produccion": "bajo / medio / alto"
    }
  ]
}

Variá los formatos (Reel, Carrusel, Historia, Post estático, TikTok, YouTube Short).
Variá los objetivos (no pongas todo educativo ni todo ventas).
Distribuí los posts de forma estratégica (ej: no dos posts el mismo día).
Pensá en una narrativa progresiva que construya la marca a lo largo del período.`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 4000,
        temperature: 0.7,
        messages: [
          { role: "system", content: "Sos un experto en marketing de contenidos. Respondés siempre con JSON válido y nada más, sin backticks." },
          { role: "user", content: prompt }
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: data.error?.message || "Error de API" });

    const text = data.choices?.[0]?.message?.content || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: "Error al planificar: " + err.message });
  }
}
