export type ArticleContent = {
  title: string;
  desc: string;
  paragraphs: string[];
};

export const supportArticles: Record<string, ArticleContent> = {
  "central-ajuda": {
    title: "Central de ajuda",
    desc: "Guias e tutoriais sobre o Pinguim",
    paragraphs: [
      "Bem-vindo à Central de ajuda do Pinguim. Aqui você encontra guias passo a passo sobre como usar o app: criar seu perfil, publicar fotos e stories, iniciar conversas, gerenciar sua carteira e realizar saques.",
      "Se não encontrar o que procura, acesse as Perguntas frequentes ou envie uma mensagem para nossa equipe pelo item Falar com suporte.",
    ],
  },
  "perguntas-frequentes": {
    title: "Perguntas frequentes",
    desc: "Dúvidas comuns respondidas",
    paragraphs: [
      "Como funciona o valor por conversa? Cada conversa iniciada por outro usuário gera um crédito no seu saldo — 70% do valor vai para você e 30% permanece com a plataforma.",
      "Qual o valor mínimo para saque? R$ 50,00, transferidos via PIX para a chave cadastrada em sua conta.",
      "Meus dados estão seguros? Sim. Utilizamos criptografia em trânsito e em repouso, e seguimos as diretrizes da LGPD.",
    ],
  },
  "falar-com-suporte": {
    title: "Falar com suporte",
    desc: "Entre em contato com nossa equipe",
    paragraphs: [
      "Nosso atendimento funciona de segunda a sexta, das 9h às 18h (horário de Brasília).",
      "Envie sua mensagem para suporte@pinguim.app descrevendo o problema com o máximo de detalhes. Responderemos em até 48 horas úteis.",
    ],
  },
  "reportar-erro": {
    title: "Reportar erro",
    desc: "Encontrou um bug? Nos avise",
    paragraphs: [
      "Se algo não está funcionando como esperado, descreva o passo a passo para reproduzir o erro, o dispositivo e a versão do app.",
      "Envie o relato para bugs@pinguim.app. Reportes com prints e detalhes técnicos são priorizados por nossa equipe de engenharia.",
    ],
  },
  "reportar-usuario": {
    title: "Reportar usuário",
    desc: "Denuncie comportamentos inadequados",
    paragraphs: [
      "O Pinguim mantém tolerância zero a assédio, discurso de ódio, fraudes ou conteúdo ilegal.",
      "Para denunciar um perfil, acesse-o e utilize a opção Denunciar no menu. Nossa equipe de moderação analisará o caso em até 24 horas.",
    ],
  },
  "solicitar-recurso": {
    title: "Solicitar recurso",
    desc: "Sugira melhorias ou novas funções",
    paragraphs: [
      "Sua opinião ajuda o Pinguim a crescer. Compartilhe ideias de novas funcionalidades, ajustes de design ou integrações que gostaria de ver.",
      "Envie sua sugestão para ideias@pinguim.app. As mais votadas pela comunidade entram em nosso roadmap trimestral.",
    ],
  },
};

export const legalArticles: Record<string, ArticleContent> = {
  "termos-de-uso": {
    title: "Termos de Uso",
    desc: "Regras gerais para utilização do app",
    paragraphs: [
      "Ao criar uma conta no Pinguim você declara ter no mínimo 18 anos e concorda com estas condições.",
      "É proibido publicar conteúdo ilegal, ofensivo ou de terceiros sem autorização. O descumprimento pode gerar suspensão ou banimento definitivo.",
      "O Pinguim pode alterar estes termos a qualquer momento; alterações relevantes serão comunicadas dentro do aplicativo.",
    ],
  },
  "politica-de-privacidade": {
    title: "Política de Privacidade",
    desc: "Como tratamos seus dados pessoais",
    paragraphs: [
      "Coletamos apenas os dados necessários para operar o serviço: cadastro, publicações, mensagens, informações de pagamento e dados de verificação de identidade.",
      "Seus dados não são vendidos a terceiros. Compartilhamos informações apenas com provedores essenciais (hospedagem, pagamentos e antifraude), sob acordo de confidencialidade.",
      "Você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento em privacidade@pinguim.app.",
    ],
  },
  "politica-de-cookies": {
    title: "Política de Cookies",
    desc: "Uso de cookies e tecnologias similares",
    paragraphs: [
      "Utilizamos cookies para manter sua sessão iniciada, lembrar preferências e medir o desempenho do app.",
      "Você pode desativar cookies nas configurações do seu navegador, mas algumas funções podem parar de funcionar corretamente.",
    ],
  },
  "politica-de-pagamentos": {
    title: "Política de Pagamentos",
    desc: "Como funcionam depósitos e cobranças",
    paragraphs: [
      "Depósitos são processados via PIX ou cartão de crédito por parceiro certificado. Créditos ficam disponíveis em sua carteira em até 5 minutos.",
      "Toda conversa iniciada gera repasse imediato ao criador (70%) e à plataforma (30%). Os valores são consolidados em seu saldo disponível.",
    ],
  },
  "politica-de-reembolso": {
    title: "Política de Reembolso",
    desc: "Regras de estorno e cancelamento",
    paragraphs: [
      "Reembolsos podem ser solicitados em até 7 dias, apenas para cobranças duplicadas ou serviço não prestado.",
      "Não realizamos reembolso de conversas já iniciadas nem de créditos utilizados. Solicite pelo e-mail financeiro@pinguim.app.",
    ],
  },
  "regras-da-comunidade": {
    title: "Regras da Comunidade",
    desc: "Como conviver bem no Pinguim",
    paragraphs: [
      "Respeite todos os usuários. Não são tolerados assédio, discurso de ódio, spam ou tentativas de golpe.",
      "Publique somente conteúdo autoral ou com direitos garantidos. Denúncias podem levar à remoção do conteúdo e suspensão do perfil.",
    ],
  },
  "diretrizes-para-publicacoes": {
    title: "Diretrizes para Publicações",
    desc: "O que pode e o que não pode ser publicado",
    paragraphs: [
      "É permitido: fotos e vídeos autorais, artes originais, textos próprios e depoimentos.",
      "É proibido: nudez explícita, conteúdo violento, incitação ao ódio, publicidade não autorizada, informações falsas e material protegido por direitos autorais alheios.",
    ],
  },
  "direitos-autorais": {
    title: "Direitos Autorais",
    desc: "Denúncias de uso indevido",
    paragraphs: [
      "Se acredita que um conteúdo publicado viola seus direitos autorais, envie um comunicado para direitosautorais@pinguim.app com prova de titularidade e o link do conteúdo.",
      "Após análise, o material infrator pode ser removido em até 48 horas.",
    ],
  },
  "propriedade-intelectual": {
    title: "Propriedade Intelectual",
    desc: "Marcas, logos e conteúdo do Pinguim",
    paragraphs: [
      "A marca Pinguim, o logotipo e todo o design do aplicativo são de propriedade exclusiva de seus criadores.",
      "É proibida a reprodução, imitação ou uso comercial sem autorização por escrito.",
    ],
  },
  "licencas-de-software": {
    title: "Licenças de Software",
    desc: "Bibliotecas de código aberto utilizadas",
    paragraphs: [
      "O Pinguim utiliza bibliotecas open source, incluindo React, TanStack Router, Tailwind CSS, Radix UI e Lucide Icons, distribuídas sob suas respectivas licenças MIT/Apache.",
      "A lista completa e créditos podem ser solicitados em licencas@pinguim.app.",
    ],
  },
  "lgpd": {
    title: "Informações sobre tratamento de dados (LGPD)",
    desc: "Seus direitos como titular",
    paragraphs: [
      "Em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018), você tem direito a acessar, corrigir, portar, anonimizar ou excluir seus dados pessoais.",
      "Para exercer seus direitos, entre em contato com nosso Encarregado de Dados (DPO) em dpo@pinguim.app.",
    ],
  },
  "consentimento-reconhecimento-facial": {
    title: "Consentimento para uso de reconhecimento facial",
    desc: "Autorização de verificação biométrica",
    paragraphs: [
      "Ao realizar a verificação por selfie, você autoriza o uso de reconhecimento facial exclusivamente para confirmar sua identidade e evitar fraudes.",
      "Sua imagem biométrica é criptografada e nunca compartilhada com terceiros. Você pode revogar este consentimento a qualquer momento excluindo sua conta.",
    ],
  },
  "consentimento-pagamentos": {
    title: "Consentimento para processamento de pagamentos",
    desc: "Autorização para cobranças e repasses",
    paragraphs: [
      "Ao adicionar um método de pagamento, você autoriza o Pinguim e seu processador parceiro a realizar cobranças, estornos e repasses relacionados aos serviços contratados.",
      "Os dados do seu cartão nunca são armazenados em nossos servidores — apenas tokens seguros fornecidos pelo processador.",
    ],
  },
};

export const supportList = Object.entries(supportArticles).map(([slug, a]) => ({
  slug,
  title: a.title,
  desc: a.desc,
}));

export const legalList = Object.entries(legalArticles).map(([slug, a]) => ({
  slug,
  title: a.title,
  desc: a.desc,
}));
