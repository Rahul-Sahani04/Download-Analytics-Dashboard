import { Calendar as CalendarIcon, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FilterOptions } from '@/types';
import { cn } from '@/lib/utils';
import { ExportButton } from './ExportButton';

interface FilterBarProps {
  filters: FilterOptions;
  onFilterChange: (filters: Partial<FilterOptions>) => void;
}

export function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const contentTypes = [
    { label: 'All Types', value: 'all' },
    { label: 'Documents', value: 'documents' },
    { label: 'Videos', value: 'videos' },
    { label: 'Images', value: 'images' },
    { label: 'Audio', value: 'audio' },
    { label: 'Presentations', value: 'presentations' },
  ];

  const userRoles = [
    { label: 'All Users', value: 'all' },
    { label: 'Students', value: 'students' },
    { label: 'Faculty', value: 'faculty' },
    { label: 'Staff', value: 'staff' },
    { label: 'Guests', value: 'guests' },
  ];

  const handleDateRangeChange = (date: Date | undefined) => {
    if (!date) return;

    const newDateRange = { ...filters.dateRange };
    
    // If no date is selected or a new selection starts
    if (!newDateRange.from || (newDateRange.from && newDateRange.to)) {
      newDateRange.from = date;
      newDateRange.to = undefined;
    } 
    // If we're selecting the end date
    else if (newDateRange.from && !newDateRange.to && date > newDateRange.from) {
      newDateRange.to = date;
    }
    // If the second date is before the first, make it the new start
    else {
      newDateRange.from = date;
      newDateRange.to = undefined;
    }

    onFilterChange({ dateRange: newDateRange });
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-card rounded-lg border p-3">
      <div className="flex flex-wrap items-center gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="text-sm justify-start border-dashed h-9"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              {filters.dateRange.from ? (
                filters.dateRange.to ? (
                  <>
                    {format(filters.dateRange.from, 'LLL dd, y')} - {format(filters.dateRange.to, 'LLL dd, y')}
                  </>
                ) : (
                  format(filters.dateRange.from, 'LLL dd, y')
                )
              ) : (
                <span>Select date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={filters.dateRange.from}
              selected={{
                from: filters.dateRange.from,
                to: filters.dateRange.to,
              }}
              onSelect={(range) => {
                onFilterChange({
                  dateRange: {
                    from: range?.from,
                    to: range?.to,
                  },
                });
              }}
              numberOfMonths={2}
              className="flex flex-col md:flex-row gap-2"
            />
          </PopoverContent>
        </Popover>

        <Select
          value={filters.contentType}
          onValueChange={(value) => onFilterChange({ contentType: value })}
        >
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue placeholder="Content Type" />
          </SelectTrigger>
          <SelectContent>
            {contentTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.userRole}
          onValueChange={(value) => onFilterChange({ userRole: value })}
        >
          <SelectTrigger className="w-[140px] h-9 text-sm">
            <SelectValue placeholder="User Role" />
          </SelectTrigger>
          <SelectContent>
            {userRoles.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" className="h-9 gap-1" onClick={() => {
          onFilterChange({
            dateRange: { from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), to: new Date() },
            contentType: 'all',
            userRole: 'all',
          });
        }}>
          <Filter className="h-3.5 w-3.5" />
          Reset
        </Button>
      </div>

      <ExportButton />
    </div>
  );
}