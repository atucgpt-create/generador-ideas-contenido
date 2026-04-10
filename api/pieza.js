export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  const { marca, rubro, tono, objetivo, plataforma, formato, tema, angulo, objetivo_post } = req.body;
  if (!rubro || !tema) return res.status(400).json({ error: "Faltan datos" });

  const prompt = `Sos un experto community manager y guionista de contenido digital. Creá una pieza de contenido COMPLETA y LISTA PARA USAR para la siguiente situación:

MARCA:
- Nombre: ${marca || "la marca"}
- Rubro: ${rubro}
- Tono de voz: ${tono || "profesional pero cercano"}
- Objetivo general: ${objetivo || "generar comunidad y ventas"}

PIEZA A CREAR:
- Plataforma: ${plataforma || "Instagram"}
- Formato: ${formato || "Reel"}
- Tema: ${tema}
- Ángulo: ${angulo || "educativo"}
- Objetivo del post: ${objetivo_post || "educar"}

Respondé SOLO con JSON válido, sin backticks ni texto extra:
{
  "hook": "La primera frase/imagen que para el scroll (máx 10 segundos)",
  "guion": {
    "intro": "Texto palabra por palabra de la introducción (5-10 seg)",
    "desarrollo": "Texto palabra por palabra del desarrollo con todos los puntos",
    "cierre": "Texto palabra por palabra del cierre con CTA"
  },
  "tomas": [
    {
      "numero": 1,
      "duracion": "3 seg",
      "descripcion": "Qué se ve en pantalla",
      "camara": "Plano detalle / Plano medio / Gran angular / Selfie / etc",
      "texto_pantalla": "Texto que aparece superpuesto si aplica",
      "audio": "Lo que dice el locutor/creador en esta toma"
    }
  ],
  "copy": "Caption completo listo para pegar en Instagram/TikTok con emojis, saltos de línea y CTA",
  "hashtags": ["hashtag1", "hashtag2"],
  "musica": "Descripción del estilo de música o sonido recomendado",
  "tip_produccion": "Consejo práctico para grabar esto con el celular"
}

El guión debe ser COMPLETO, no un resumen. Escribí exactamente lo que diría la persona frente a cámara.
Las tomas deben ser detalladas y filmables con un celular.
El copy debe estar listo para publicar, con emojis y formato de Instagram.`;

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
        temperature: 0.8,
        messages: [
          { role: "system", content: "Sos un experto en marketing de contenidos y guionista digital. Respondés siempre con JSON válido y nada más, sin backticks." },
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
    return res.status(500).json({ error: "Error al generar pieza: " + err.message });
  }
}
