import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'addDays'
})
export class AddDaysPipe implements PipeTransform {
  transform(value: string, days: number): string | null {

    if (!value) return '';
    const date = new Date(value);
    date.setDate(date.getDate() + days);
    const newDate = date.toISOString().split('T')[0];
    return date.toISOString();
  }
}
