import type { Category } from './finding';
import type { Codebase } from './codebase';
import type { Finding } from './finding';

export interface Agent {
  name: string;
  category: Category;
  scan(codebase: Codebase): Promise<Finding[]>;
}
