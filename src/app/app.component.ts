import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  combineLatest,
  debounceTime,
  filter,
  forkJoin,
  map,
  Observable,
  Subject,
  Subscription,
  switchMap,
} from 'rxjs';
import { MockDataService } from './mock-data.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  searchTermByCharacters = new Subject<string>();
  charactersResults$!: Observable<any>;
  planetAndCharactersResults$!: Observable<any>;
  isLoading: boolean = false;
  subscriptions: Subscription[] = [];

  constructor(private mockDataService: MockDataService) {}

  ngOnInit(): void {
    this.initLoadingState();
    this.initCharacterEvents();
  }

  changeCharactersInput(element: any): void {
    const inputValue: string = element.target.value;
    // 1.1 - Emit value to Subject
    this.searchTermByCharacters.next(inputValue);
  }

  initCharacterEvents(): void {
    this.charactersResults$ = this.searchTermByCharacters
      .pipe(
        // 2. Filter - only proceed if at least 3 characters
        filter((value: string) => value.length >= 3),
        
        // 3. Debounce - wait 300ms after user stops typing
        debounceTime(300),
        
        // 1.2 - Make API call using switchMap
        switchMap((searchTerm: string) => 
          this.mockDataService.getCharacters(searchTerm)
        )
      );
  }

  loadCharactersAndPlanet(): void {
    // 4. Use forkJoin to combine both requests
    this.planetAndCharactersResults$ = forkJoin([
      this.mockDataService.getCharacters(),
      this.mockDataService.getPlanets()
    ]).pipe(
      map(([characters, planets]) => [...characters, ...planets])
    );
  }

  initLoadingState(): void {
    // 5.1 Combine loader streams with combineLatest
    const subscription = combineLatest([
      this.mockDataService.getCharactersLoader(),
      this.mockDataService.getPlanetLoader()
    ]).subscribe((loadingStates: boolean[]) => {
      this.isLoading = this.isAtLeastOneTrue(loadingStates);
    });
    
    this.subscriptions.push(subscription);
  }

  ngOnDestroy(): void {
    // 5.2 Unsubscribe from all subscriptions
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  isAtLeastOneTrue(elements: boolean[]): boolean {
    return elements.some((el) => el);
  }
}