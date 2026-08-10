/** Grid of clickable use case cards on home page */

import { Bug, TestTube, FileText, Rocket, RefreshCw, Database, BarChart, Search, Link, Package } from 'lucide-react';
import { Card, CardBody, CardTitle } from '@patternfly/react-core';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

interface QuickStartCard {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  category: 'quick' | 'build' | 'analysis' | 'ops';
  prompt: string;
}

const CARDS: QuickStartCard[] = [
  // Quick Tasks (green)
  {
    id: 'fix-bug',
    title: 'Fix a Bug',
    icon: <Bug className="w-6 h-6" />,
    description: 'Paste a stack trace and I\'ll find the fix',
    category: 'quick',
    prompt: 'Fix this bug. Here\'s the error:\n\n',
  },
  {
    id: 'write-tests',
    title: 'Write Tests',
    icon: <TestTube className="w-6 h-6" />,
    description: 'Generate test suite for any module',
    category: 'quick',
    prompt: 'Write comprehensive tests for: ',
  },
  {
    id: 'add-docs',
    title: 'Add Documentation',
    icon: <FileText className="w-6 h-6" />,
    description: 'Generate docs from your code',
    category: 'quick',
    prompt: 'Generate documentation for: ',
  },
  // Build Features (blue)
  {
    id: 'build-api',
    title: 'Build API Endpoint',
    icon: <Rocket className="w-6 h-6" />,
    description: 'From spec to PR with tests and validation',
    category: 'build',
    prompt: 'Build an API endpoint: ',
  },
  {
    id: 'refactor',
    title: 'Refactor Code',
    icon: <RefreshCw className="w-6 h-6" />,
    description: 'Modernize endpoints, update patterns',
    category: 'build',
    prompt: 'Refactor: ',
  },
  {
    id: 'db-migration',
    title: 'Database Migration',
    icon: <Database className="w-6 h-6" />,
    description: 'Schema changes with safe migration scripts',
    category: 'build',
    prompt: 'Create a database migration: ',
  },
  // Data & Analysis (orange)
  {
    id: 'analyze-data',
    title: 'Analyze Data Product',
    icon: <BarChart className="w-6 h-6" />,
    description: 'Query, analyze, and visualize your data',
    category: 'analysis',
    prompt: 'Analyze this data: ',
  },
  {
    id: 'code-audit',
    title: 'Code Audit',
    icon: <Search className="w-6 h-6" />,
    description: 'Security, performance, and quality review',
    category: 'analysis',
    prompt: 'Audit this code for security, performance, and quality: ',
  },
  // Operations (purple)
  {
    id: 'system-integration',
    title: 'System Integration',
    icon: <Link className="w-6 h-6" />,
    description: 'Connect services, write adapters',
    category: 'ops',
    prompt: 'Create an integration between: ',
  },
  {
    id: 'create-microservice',
    title: 'Create Microservice',
    icon: <Package className="w-6 h-6" />,
    description: 'Full service from scratch with CI/CD',
    category: 'ops',
    prompt: 'Create a new microservice: ',
  },
];

const CATEGORY_COLORS = {
  quick: 'border-green-600/30 hover:border-green-600/60 hover:bg-green-600/10',
  build: 'border-blue-600/30 hover:border-blue-600/60 hover:bg-blue-600/10',
  analysis: 'border-orange-600/30 hover:border-orange-600/60 hover:bg-orange-600/10',
  ops: 'border-purple-600/30 hover:border-purple-600/60 hover:bg-purple-600/10',
};

const CATEGORY_LABELS = {
  quick: '⚡ Quick Tasks',
  build: '🔧 Build Features',
  analysis: '📊 Data & Analysis',
  ops: '⚙️ Operations',
};

interface QuickStartCardsProps {
  onCardClick: (prompt: string) => void;
}

export function QuickStartCards({ onCardClick }: QuickStartCardsProps) {
  const cardsByCategory = {
    quick: CARDS.filter((c) => c.category === 'quick'),
    build: CARDS.filter((c) => c.category === 'build'),
    analysis: CARDS.filter((c) => c.category === 'analysis'),
    ops: CARDS.filter((c) => c.category === 'ops'),
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Loop Engineering
        </h2>
        <p className="text-muted-foreground">What would you like to build?</p>
      </div>

      {Object.entries(cardsByCategory).map(([category, cards]) => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cards.map((card) => (
              <Card
                key={card.id}
                isClickable
                onClick={() => onCardClick(card.prompt)}
                className={`border-2 transition-all cursor-pointer ${
                  CATEGORY_COLORS[card.category]
                }`}
              >
                <CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="text-foreground">{card.icon}</div>
                    <span className="text-foreground font-semibold">{card.title}</span>
                  </div>
                </CardTitle>
                <CardBody>
                  <p className="text-sm text-muted-foreground">{card.description}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
