const axios = require('axios');
const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
  // 1. Identifica o IP do usuário para o limite
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const key = `limit:${ip}`;
  const { check } = req.query; // Permite o link ?check=1

  try {
    // 2. Consulta o banco: quantos downloads o IP fez hoje?
    const count = await kv.get(key) || 0;
    const limit = 5;
    const remaining = limit - count;

    // 3. Se for apenas para checar o status (não conta como download)
    if (check) {
      return res.status(200).json({
        seu_ip: ip,
        downloads_feitos_hoje: count,
        downloads_restantes: remaining > 0 ? remaining : 0,
        liberado: remaining > 0
      });
    }

    // 4. Bloqueia se já atingiu 5 downloads
    if (count >= limit) {
      return res.status(429).send("Limite de 5 downloads por dia atingido para este IP.");
    }

    // --- CONFIGURAÇÕES DO SEU GITHUB ---
    const USER = "iurysouza041095-bit"; 
    const REPO = "myconfigs"; 
    const FOLDER = "configs"; 
    const TOKEN = process.env.GITHUB_TOKEN;

    // 5. Busca arquivos no repositório privado
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

    // 6. Sorteio aleatório
    const randomFile = configs[Math.floor(Math.random() * configs.length)];

    // 7. Busca o conteúdo real do arquivo
    const fileContent = await axios.get(randomFile.download_url, {
      headers: { 'Authorization': `token ${TOKEN}` }
    });

    // 8. Se tudo deu certo, registra +1 download no banco (expira em 24h)
    await kv.set(key, count + 1, { ex: 86400 });

    // 9. Entrega o arquivo
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
