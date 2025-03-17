import stringSimilarity from 'string-similarity';
import { QueryTemplate, queryTemplates } from './query-templates';

interface MatchResult {
  template: QueryTemplate;
  confidence: number;
  params?: any;
}

export function matchQueryIntent(userInput: string): MatchResult | null {
  // Preprocess user input
  const normalizedInput = userInput.toLowerCase().trim();
  
  // Extract potential parameters
  const params: any = {};
  
  // Check for numbers that might be limits
  const numberMatch = normalizedInput.match(/\b(\d+)\b/);
  if (numberMatch) {
    params.limit = parseInt(numberMatch[1], 10);
  }
  
  // Extract customer names
  // Look for patterns like "named [Name]", "named [Name] [Surname]", etc.
  const nameMatch = normalizedInput.match(/named\s+([a-zA-Z\s]+)/i);
  if (nameMatch && nameMatch[1]) {
    params.name = nameMatch[1].trim();
    
    // If we found a name with "named [Name]" pattern, this is almost certainly
    // a customer-by-name query, so we can directly return that template
    const customerByNameTemplate = queryTemplates.find(t => t.id === 'customer-by-name');
    if (customerByNameTemplate) {
      console.log("Direct match for 'named [Name]' pattern");
      return {
        template: customerByNameTemplate,
        confidence: 0.95,
        params
      };
    }
  }
  
  // Alternative pattern: "find customer [Name]"
  if (!params.name) {
    const altNameMatch = normalizedInput.match(/find customer\s+([a-zA-Z\s]+)/i);
    if (altNameMatch && altNameMatch[1]) {
      params.name = altNameMatch[1].trim();
      
      // If we found a name with "find customer [Name]" pattern, this is almost certainly
      // a customer-by-name query, so we can directly return that template
      const customerByNameTemplate = queryTemplates.find(t => t.id === 'customer-by-name');
      if (customerByNameTemplate) {
        console.log("Direct match for 'find customer [Name]' pattern");
        return {
          template: customerByNameTemplate,
          confidence: 0.95,
          params
        };
      }
    }
  }
  
  // Match against templates
  let bestMatch: MatchResult | null = null;
  let highestScore = 0.4; // Lower threshold for matching
  
  for (const template of queryTemplates) {
    // Check for keyword matches
    let keywordMatches = 0;
    let keywordTotal = template.keywords.length;
    
    for (const keyword of template.keywords) {
      if (normalizedInput.includes(keyword.toLowerCase())) {
        keywordMatches += 1;
      }
    }
    
    // Calculate string similarity as fallback
    const similarityScore = stringSimilarity.compareTwoStrings(
      normalizedInput,
      template.description.toLowerCase()
    );
    
    // Combined score (weighted)
    const keywordScore = keywordMatches / keywordTotal;
    let combinedScore = (keywordScore * 0.7) + (similarityScore * 0.3);
    
    // Special case for customer-by-name if we have a name parameter
    if (params.name && template.id === 'customer-by-name') {
      combinedScore += 0.3; // Boost the score
    }
    
    if (combinedScore > highestScore) {
      highestScore = combinedScore;
      bestMatch = {
        template,
        confidence: combinedScore,
        params
      };
    }
  }
  
  // Debug output
  console.log("User input:", userInput);
  console.log("Extracted params:", params);
  console.log("Best match:", bestMatch?.template.id, "with confidence:", bestMatch?.confidence);
  
  return bestMatch;
}