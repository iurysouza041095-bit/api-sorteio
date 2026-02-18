const axios = require('axios');

module.exports = async (req, res) => {
  // Configurações exatas com seus dados
  const USER = "iurysouza041095-bit"; 
  const REPO = "myconfigs"; // Nome que você passou
  const FOLDER = "configs";   // Pasta onde estão os arquivos .config
  const TOKEN = process.env.GITHUB_TOKEN;

  try {
    // 1. Busca a lista de arquivos (puxando até 1000 de uma vez)
    const url = `https://api.github.com/repos/${USER}/${REPO}/contents/${FOLDER}?per_page=1000`;
    
    const response = await axios.get(url, {
      headers: { 
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    // 2. Filtra arquivos .config
    const configs = response.data.filter(file => file.name.toLowerCase().endsWith('.config'));

    if (configs.length === 0) {
      return res.status(404).send("Nenhum arquivo .config encontrado no repositório.");
    }

    // 3. Sorteio aleatório
    const randomFile = configs[Math.floor(Math.random() * configs.length)];

    // 4. Busca o conteúdo real do arquivo escolhido
    const fileContent = await axios.get(randomFile.download_url, {
      headers: { 'Authorization': `token ${TOKEN}` }
    });

    // 5. Cabeçalhos para forçar o download com o nome original (ex: 1000.config)
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${randomFile.name}"`);
    
    // 6. Envia o conteúdo do arquivo
    res.status(200).send(fileContent.data);

  } catch (error) {
    res.status(500).json({
      error: "Erro na API",
      details: error.message
    });
  }
};
