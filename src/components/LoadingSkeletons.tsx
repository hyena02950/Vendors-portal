
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const StatsCardSkeleton = () => (
  <Card className="bg-gradient-card shadow-md">
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-6 rounded-md" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
    </CardContent>
  </Card>
);

export const JobCardSkeleton = () => (
  <Card className="bg-gradient-card shadow-sm">
    <CardContent className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center space-x-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="flex flex-wrap gap-1">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export const TableRowSkeleton = ({ columns = 4 }: { columns?: number }) => (
  <tr className="border-b">
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="p-4">
        <Skeleton className="h-4 w-full" />
      </td>
    ))}
  </tr>
);

export const UserProfileSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
    </CardContent>
  </Card>
);
