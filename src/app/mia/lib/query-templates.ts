export interface QueryTemplate {
    id: string;
    name: string;
    description: string;
    keywords: string[];
    query: (shopId: string, params?: any) => {
        text: string;
        values: any[];
    };
    formatResult?: (result: any) => any;
}
  
export const queryTemplates: QueryTemplate[] = [
    {
      id: 'total-customers',
      name: 'Total customers',
      description: 'Total number of customers',
      keywords: ['total customers', 'all customers', 'customer count', 'how many customers'],
      query: (shopId: string) => ({
        text: `
          SELECT COUNT(*) as count 
          FROM customers 
          WHERE shop_id = $1
        `,
        values: [shopId]
      }),
      formatResult: (result) => {
        return {
          count: result[0]?.count || 0,
          message: `You have a total of ${result[0]?.count || 0} customers.`
        };
      }
    },
    {
      id: 'new-customers-month',
      name: 'New customers this month',
      description: 'Count of new customers who signed up this month',
      keywords: ['new customers', 'this month', 'signed up', 'joined', 'new signups'],
      query: (shopId: string) => {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        return {
          text: `
            SELECT COUNT(*) as count 
            FROM customers 
            WHERE created_at >= $1 
            AND shop_id = $2
          `,
          values: [firstDayOfMonth, shopId]
        };
      },
      formatResult: (result) => {
        return {
          count: result[0]?.count || 0,
          message: `You have ${result[0]?.count || 0} new customers this month.`
        };
      }
    },
    {
      id: 'customer-list',
      name: 'Customer list',
      description: 'List of customers',
      keywords: ['list customers', 'show customers', 'all customers', 'customer list'],
      query: (shopId: string, params: { limit?: number } = {}) => ({
        text: `
          SELECT id, customer_name, customer_email, customer_phone, created_at
          FROM customers 
          WHERE shop_id = $1
          ORDER BY created_at DESC
          LIMIT $2
        `,
        values: [shopId, params.limit || 10]
      }),
      formatResult: (result) => {
        return {
          customers: result,
          message: `Here are your ${result.length} most recent customers.`
        };
      }
    },
    {
      id: 'customer-by-name',
      name: 'Find customer by name',
      description: 'Find a specific customer by name',
      keywords: ['find customer', 'search customer', 'customer named', 'lookup customer'],
      query: (shopId: string, params: { name?: string } = {}) => {
        // Extract name from the params or from the query
        const searchName = params.name || '';
        return {
          text: `
            SELECT * 
            FROM customers 
            WHERE shop_id = $1
            AND LOWER(customer_name) LIKE LOWER($2)
            LIMIT 5
          `,
          values: [shopId, `%${searchName}%`]
        };
      },
      formatResult: (result) => {
        if (result.length === 0) {
          return {
            customers: [],
            message: "I couldn't find any customers with that name."
          };
        }
        return {
          customers: result,
          message: `I found ${result.length} customer(s) matching that name.`
        };
      }
    },
    // Add more query templates as needed for your specific shop data
];