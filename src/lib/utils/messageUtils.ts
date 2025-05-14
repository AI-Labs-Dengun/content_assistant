// Verifica se uma string contém hashtags
const hasHashtags = (text: string): boolean => {
  return /#\w+/.test(text);
};

// Verifica se uma string contém divisor de linha
const hasDivider = (text: string): boolean => {
  return text.includes('---');
};

// Verifica se o conteúdo é um post válido
const isValidPost = (content: string): boolean => {
  return hasHashtags(content) && hasDivider(content);
};

// Limpa o conteúdo do post para cópia
const cleanPostContent = (content: string): string => {
  // Divide o conteúdo pelas linhas divisórias
  const parts = content.split('---');
  
  // Se não houver pelo menos duas linhas divisórias, retorna o conteúdo original
  if (parts.length < 2) {
    return content.trim();
  }
  
  // Pega o conteúdo entre as duas primeiras linhas divisórias
  const mainContent = parts[1].trim();
  
  // Remove a formatação de negrito, itálico e outros elementos de formatação
  const contentWithoutFormatting = mainContent
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove asteriscos de negrito
    .replace(/__(.*?)__/g, '$1') // Remove underscores de negrito
    .replace(/_(.*?)_/g, '$1') // Remove underscores de itálico
    .replace(/\*(.*?)\*/g, '$1') // Remove asteriscos de itálico
    .replace(/\n{3,}/g, '\n\n') // Remove múltiplas quebras de linha
    .trim();
  
  return contentWithoutFormatting;
};

// Função principal para copiar o conteúdo de uma mensagem
export const copyMessageContent = (content: string): string | null => {
  try {
    if (!isValidPost(content)) {
      return null;
    }

    const cleanedContent = cleanPostContent(content);
    
    // Verifica se o conteúdo está vazio após a limpeza
    if (!cleanedContent) {
      return null;
    }

    return cleanedContent;
  } catch (err) {
    console.error('Erro ao processar conteúdo:', err);
    return null;
  }
};

export const isPostResponse = (content: string): boolean => {
  // Verifica se é uma resposta de post (contém hashtags e divisor de linha)
  return hasHashtags(content) && hasDivider(content);
}; 