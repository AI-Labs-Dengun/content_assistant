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
  // Divide o conteúdo pela linha divisória
  const [mainContent] = content.split('---');
  
  // Remove espaços extras e limpa o conteúdo
  const cleanContent = mainContent.trim();
  
  // Remove a formatação de negrito
  const contentWithoutFormatting = cleanContent
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove asteriscos de negrito
    .replace(/__(.*?)__/g, '$1') // Remove underscores de negrito
    // .replace(/\n{3,}/g, '\n\n') // Remove múltiplas quebras de linha
    .trim();
  
  return contentWithoutFormatting;
};

// Função principal para copiar o conteúdo de uma mensagem
export const copyMessageContent = (content: string): string | null => {
  try {4
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