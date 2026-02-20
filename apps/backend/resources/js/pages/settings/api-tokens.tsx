import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Copy, Key, Trash2 } from 'lucide-react';

interface Token {
    id: string;
    name: string;
    created_at: string;
    last_used_at: string | null;
}

interface Props {
    tokens: Token[];
    newToken?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'AI Assistant',
        href: '/settings/api-tokens',
    },
];

export default function ApiTokens({ tokens, newToken }: Props) {
    const [showNewToken, setShowNewToken] = useState(!!newToken);
    const [copied, setCopied] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        name: '',
    });

    const copyToken = () => {
        if (newToken) {
            navigator.clipboard.writeText(newToken);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const createToken = (e: React.FormEvent) => {
        e.preventDefault();
        post('/settings/api-tokens', {
            onSuccess: () => {
                reset();
                setShowNewToken(true);
            },
        });
    };

    const revokeToken = (tokenId: string) => {
        if (confirm('Are you sure you want to revoke this token? Any AI assistants using it will lose access.')) {
            router.delete(`/settings/api-tokens/${tokenId}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="AI Assistant" />

            <div className="px-4 py-6">
                <div className="mx-auto max-w-2xl space-y-8">
                    <HeadingSmall
                        title="AI Assistant Integration"
                        description="Connect AI assistants like Claude to manage your tasks using natural language."
                    />

                    {/* New token display */}
                    {showNewToken && newToken && (
                        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
                            <p className="mb-2 text-sm font-medium text-green-800 dark:text-green-200">
                                Your new API token has been created. Copy it now — you won't be able to see it again.
                            </p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 rounded bg-green-100 p-2 font-mono text-sm dark:bg-green-900">
                                    {newToken}
                                </code>
                                <Button variant="outline" size="sm" onClick={copyToken}>
                                    <Copy className="mr-1 h-4 w-4" />
                                    {copied ? 'Copied!' : 'Copy'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Create token form */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Create API Token</h3>
                        <form onSubmit={createToken} className="flex gap-2">
                            <div className="flex-1">
                                <Label htmlFor="name" className="sr-only">
                                    Token name
                                </Label>
                                <Input
                                    id="name"
                                    placeholder="Token name (e.g., Claude Desktop)"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                            </div>
                            <Button type="submit" disabled={processing || !data.name}>
                                <Key className="mr-1 h-4 w-4" />
                                Create Token
                            </Button>
                        </form>
                    </div>

                    {/* Existing tokens */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Your Tokens</h3>
                        {tokens.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No tokens yet. Create one to connect your AI assistant.
                            </p>
                        ) : (
                            <div className="divide-y rounded-lg border">
                                {tokens.map((token) => (
                                    <div key={token.id} className="flex items-center justify-between p-4">
                                        <div>
                                            <p className="font-medium">{token.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Created {new Date(token.created_at).toLocaleDateString()}
                                                {token.last_used_at && (
                                                    <> · Last used {new Date(token.last_used_at).toLocaleDateString()}</>
                                                )}
                                            </p>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => revokeToken(token.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Setup instructions */}
                    <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
                        <h3 className="text-lg font-medium">Setup Instructions</h3>
                        <div className="space-y-3 text-sm">
                            <p>
                                <strong>Claude Desktop:</strong> Add this to your{' '}
                                <code className="rounded bg-muted px-1">claude_desktop_config.json</code>:
                            </p>
                            <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">
                                {JSON.stringify(
                                    {
                                        mcpServers: {
                                            ballistic: {
                                                url: `${window.location.origin}/mcp`,
                                                headers: {
                                                    Authorization: 'Bearer YOUR_TOKEN_HERE',
                                                },
                                            },
                                        },
                                    },
                                    null,
                                    2,
                                )}
                            </pre>
                            <p className="text-muted-foreground">
                                Replace <code className="rounded bg-muted px-1">YOUR_TOKEN_HERE</code> with the token you
                                created above.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
