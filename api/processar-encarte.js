export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  const { imagem, tipo, mercado } = req.body;

  if (!imagem || !tipo || !mercado) {
    return res.status(400).json({ erro: 'Dados incompletos' });
  }

  try {
    const tipoConteudo = tipo === 'application/pdf' ? 'document' : 'image';

    const resposta = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            {
              type: tipoConteudo,
              source: { type: 'base64', media_type: tipo, data: imagem }
            },
            {
              type: 'text',
              text: `Este é um encarte do supermercado ${mercado}. Extraia TODOS os produtos e preços que encontrar. Responda APENAS em JSON válido, sem texto adicional, no formato: {"produtos": [{"nome": "Nome do produto com quantidade/peso", "preco": 0.00, "em_promocao": true}]}. Inclua todos os produtos visíveis. Preço deve ser número decimal. em_promocao deve ser true para todos pois estão no encarte.`
            }
          ]
        }]
      })
    });

    const dados = await resposta.json();

    if (dados.error) {
      return res.status(500).json({ erro: dados.error.message });
    }

    const texto = dados.content[0].text.trim();
    const json = JSON.parse(texto.replace(/```json|```/g, '').trim());

    return res.status(200).json(json);

  } catch (erro) {
    return res.status(500).json({ erro: erro.message });
  }
}
