const axios = require('axios');
const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
  // 1. Identifica o IP do usuário para o limite
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const key = `limit:${ip}`;

  try {
    // 2. Verifica quantos downloads o IP já fez nas últimas 24h
    const count = await kv.get(key) || 0;

    if (count >= 5) {
      return res.status(429).send("Limite de 5 downloads por dia atingido para este IP.");
    }

    // --- CONFIGURAÇÕES DO SEU GITHUB ---
    const USER = "iurysouza041095-bit"; 
    const REPO = "myconfigs"; 
    const FOLDER = "configs"; 
    const TOKEN = process.env.GITHUB_TOKEN;

    // 3. Busca a lista de arquivos no GitHub
    const url = `https://api.github.com/repos/${USER}/${REPO}/contents/${FOLDER}?per_page=1000`;
    const response = await axios.get(url, {
      headers: { 
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    const configs = response.data.filter(file => file.name.toLowerCase().endsWith('.config'));

    if (configs.length === 0) {
      return res.status(404).send("Nenhum arquivo .config encontrado.");
    }

    // 4. Sorteia um arquivo aleatório
    const randomFile = configs[Math.floor(Math.random() * configs.length)];

    // 5. Busca o conteúdo do arquivo sorteado
    const fileContent = await axios.get(randomFile.download_url, {
      headers: { 'Authorization': `token ${TOKEN}` }
    });

    // 6. Se o download deu certo, aumenta o contador do IP no Banco de Dados
    // O contador expira automaticamente em 24 horas (86400 segundos)
    await kv.set(key, count + 1, { ex: 86400 });

    // 7. Entrega o arquivo para download
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${randomFile.name}"`);
    res.status(200).send(fileContent.data);

  } catch (error) {
    res.status(500).json({
      error: "Erro na API",
      message: error.message
    });
  }
};
