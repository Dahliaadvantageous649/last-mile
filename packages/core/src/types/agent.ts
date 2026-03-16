export interface Agent { scan(codebase: Codebase): Promise<Finding[]>; }
