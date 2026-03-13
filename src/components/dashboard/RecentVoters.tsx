import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Voter } from '@/types/campaign';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

interface RecentVotersProps {
    voters: Voter[];
}

export const RecentVoters = ({ voters }: RecentVotersProps) => {
    // Show last 5 voters
    const recentVoters = [...voters]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-primary" />
                    Recent Voters
                </CardTitle>
            </CardHeader>
            <CardContent>
                {recentVoters.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No voters registered yet.</p>
                ) : (
                    <div className="space-y-4">
                        {recentVoters.map((voter) => (
                            <div
                                key={voter.id}
                                className="flex items-start justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                            >
                                <div className="space-y-1">
                                    <p className="font-medium leading-none">{voter.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {(voter.clan ?? '') || (voter.pollingStationName ?? '')
                                            ? `${voter.clan ?? ''}${voter.clan && voter.pollingStationName ? ' • ' : ''}${voter.pollingStationName ?? ''}`
                                            : ''}
                                    </p>
                                    <div className="flex gap-2 text-xs text-muted-foreground">
                                        <span>ID: {voter.idNumber}</span>
                                        {voter.phoneNumber && <span>• {voter.phoneNumber}</span>}
                                    </div>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={
                                        voter.status === 'confirmed'
                                            ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                                            : voter.status === 'likely'
                                                ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
                                                : 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'
                                    }
                                >
                                    {voter.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
