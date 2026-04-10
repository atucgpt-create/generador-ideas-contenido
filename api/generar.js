export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { rubro, audiencia, formato, cantidad } = req.body;

  if (!rubro) {
    return res.status(400).json({ error: "El rubro es obligatorio" });
  }

  const prompt = `Generá ${cantidad || 6} ideas de contenido originales y accionables para alguien del rubro "${rubro}"${audiencia ? ` cuya audiencia es: ${audiencia}` : ""}, en formato "${formato || "Reels / TikTok"}".

Respondé SOLO con un JSON válido, sin backticks ni texto extra. El formato debe ser exactamente:
{"ideas":[{"titulo":"...","descripcion":"...","angulo":"...","hook":"..."}]}

Donde:
- titulo: el tema o título del contenido (máx 12 palabras)
- descripcion: qué mostrar o contar exactamente (2-3 oraciones concretas y específicas)
- angulo: el tipo de contenido (educativo, inspiracional, entretenimiento, prueba social, detrás de escena, polémico, tutorial, tendencia, etc.)
- hook: la primera frase con la que arrancarías ese contenido para enganchar a la audiencia

Las ideas deben ser MUY específicas del rubro, no genéricas. Sé creativo y práctico.`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 2000,
        temperature: 0.8,
        messages: [
          {
            role: "system",
            content: "Sos un experto en marketing de contenidos para redes sociales hispanohablantes. Respondés siempre con JSON válido y nada más."
          },
          {
            role: "user",
            content: prompt
          }
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data.error?.message || "Error de Groq API" });
    }

    const text = data.choices?.[0]?.message?.content || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: "Error al generar ideas: " + err.message });
  }
}

