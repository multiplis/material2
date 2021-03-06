import {async, ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {Component, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {BrowserAnimationsModule, NoopAnimationsModule} from '@angular/platform-browser/animations';
import {By} from '@angular/platform-browser';
import {ViewportRuler} from '@angular/cdk/scrolling';
import {dispatchFakeEvent, FakeViewportRuler} from '@angular/cdk/testing';
import {Observable} from 'rxjs/Observable';
import {MdTab, MdTabGroup, MdTabHeaderPosition, MdTabsModule} from './index';


describe('MdTabGroup', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [MdTabsModule, NoopAnimationsModule],
      declarations: [
        SimpleTabsTestApp,
        SimpleDynamicTabsTestApp,
        BindedTabsTestApp,
        AsyncTabsTestApp,
        DisabledTabsTestApp,
        TabGroupWithSimpleApi,
      ],
      providers: [
        {provide: ViewportRuler, useClass: FakeViewportRuler},
      ]
    });

    TestBed.compileComponents();
  }));

  describe('basic behavior', () => {
    let fixture: ComponentFixture<SimpleTabsTestApp>;

    beforeEach(() => {
      fixture = TestBed.createComponent(SimpleTabsTestApp);
    });

    it('should default to the first tab', () => {
      checkSelectedIndex(1, fixture);
    });

    it('should change selected index on click', () => {
      let component = fixture.debugElement.componentInstance;
      component.selectedIndex = 0;
      checkSelectedIndex(0, fixture);

      // select the second tab
      let tabLabel = fixture.debugElement.queryAll(By.css('.mat-tab-label'))[1];
      tabLabel.nativeElement.click();
      checkSelectedIndex(1, fixture);

      // select the third tab
      tabLabel = fixture.debugElement.queryAll(By.css('.mat-tab-label'))[2];
      tabLabel.nativeElement.click();
      checkSelectedIndex(2, fixture);
    });

    it('should support two-way binding for selectedIndex', async(() => {
      let component = fixture.componentInstance;
      component.selectedIndex = 0;

      fixture.detectChanges();

      let tabLabel = fixture.debugElement.queryAll(By.css('.mat-tab-label'))[1];
      tabLabel.nativeElement.click();

      fixture.detectChanges();
      fixture.whenStable().then(() => {
        expect(component.selectedIndex).toBe(1);
      });
    }));

    it('should change tabs based on selectedIndex', fakeAsync(() => {
      let component = fixture.componentInstance;
      let tabComponent = fixture.debugElement.query(By.css('md-tab-group')).componentInstance;

      spyOn(component, 'handleSelection').and.callThrough();

      checkSelectedIndex(1, fixture);

      tabComponent.selectedIndex = 2;

      checkSelectedIndex(2, fixture);
      tick();

      expect(component.handleSelection).toHaveBeenCalledTimes(1);
      expect(component.selectEvent.index).toBe(2);
    }));

    it('should update tab positions when selected index is changed', () => {
      fixture.detectChanges();
      const component: MdTabGroup =
          fixture.debugElement.query(By.css('md-tab-group')).componentInstance;
      const tabs: MdTab[] = component._tabs.toArray();

      expect(tabs[0].position).toBeLessThan(0);
      expect(tabs[1].position).toBe(0);
      expect(tabs[2].position).toBeGreaterThan(0);

      // Move to third tab
      component.selectedIndex = 2;
      fixture.detectChanges();
      expect(tabs[0].position).toBeLessThan(0);
      expect(tabs[1].position).toBeLessThan(0);
      expect(tabs[2].position).toBe(0);

      // Move to the first tab
      component.selectedIndex = 0;
      fixture.detectChanges();
      expect(tabs[0].position).toBe(0);
      expect(tabs[1].position).toBeGreaterThan(0);
      expect(tabs[2].position).toBeGreaterThan(0);
    });

    it('should clamp the selected index to the size of the number of tabs', () => {
      fixture.detectChanges();
      const component: MdTabGroup =
          fixture.debugElement.query(By.css('md-tab-group')).componentInstance;

      // Set the index to be negative, expect first tab selected
      fixture.componentInstance.selectedIndex = -1;
      fixture.detectChanges();
      expect(component.selectedIndex).toBe(0);

      // Set the index beyond the size of the tabs, expect last tab selected
      fixture.componentInstance.selectedIndex = 3;
      fixture.detectChanges();
      expect(component.selectedIndex).toBe(2);
    });

    it('should not crash when setting the selected index to NaN', () => {
      let component = fixture.debugElement.componentInstance;

      expect(() => {
        component.selectedIndex = NaN;
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should show ripples for tab-group labels', () => {
      fixture.detectChanges();

      const testElement = fixture.nativeElement;
      const tabLabel = fixture.debugElement.queryAll(By.css('.mat-tab-label'))[1];

      expect(testElement.querySelectorAll('.mat-ripple-element').length)
        .toBe(0, 'Expected no ripples to show up initially.');

      dispatchFakeEvent(tabLabel.nativeElement, 'mousedown');
      dispatchFakeEvent(tabLabel.nativeElement, 'mouseup');

      expect(testElement.querySelectorAll('.mat-ripple-element').length)
        .toBe(1, 'Expected one ripple to show up on label mousedown.');
    });

    it('should allow disabling ripples for tab-group labels', () => {
      fixture.componentInstance.disableRipple = true;
      fixture.detectChanges();

      const testElement = fixture.nativeElement;
      const tabLabel = fixture.debugElement.queryAll(By.css('.mat-tab-label'))[1];

      expect(testElement.querySelectorAll('.mat-ripple-element').length)
        .toBe(0, 'Expected no ripples to show up initially.');

      dispatchFakeEvent(tabLabel.nativeElement, 'mousedown');
      dispatchFakeEvent(tabLabel.nativeElement, 'mouseup');

      expect(testElement.querySelectorAll('.mat-ripple-element').length)
        .toBe(0, 'Expected no ripple to show up on label mousedown.');
    });

    it('should set the isActive flag on each of the tabs', () => {
      fixture.detectChanges();

      const tabs = fixture.componentInstance.tabs.toArray();

      expect(tabs[0].isActive).toBe(false);
      expect(tabs[1].isActive).toBe(true);
      expect(tabs[2].isActive).toBe(false);

      fixture.componentInstance.selectedIndex = 2;
      fixture.detectChanges();

      expect(tabs[0].isActive).toBe(false);
      expect(tabs[1].isActive).toBe(false);
      expect(tabs[2].isActive).toBe(true);
    });
  });

  describe('dynamic binding tabs', () => {
    let fixture: ComponentFixture<SimpleDynamicTabsTestApp>;

    beforeEach(async(() => {
      fixture = TestBed.createComponent(SimpleDynamicTabsTestApp);
      fixture.detectChanges();
    }));

    it('should be able to add a new tab, select it, and have correct origin position', () => {
      fixture.detectChanges();
      const component: MdTabGroup =
          fixture.debugElement.query(By.css('md-tab-group')).componentInstance;

      let tabs: MdTab[] = component._tabs.toArray();
      expect(tabs[0].origin).toBe(null);
      expect(tabs[1].origin).toBe(0);
      expect(tabs[2].origin).toBe(null);

      // Add a new tab on the right and select it, expect an origin >= than 0 (animate right)
      fixture.componentInstance.tabs.push({label: 'New tab', content: 'to right of index'});
      fixture.componentInstance.selectedIndex = 4;
      fixture.detectChanges();

      tabs = component._tabs.toArray();
      expect(tabs[3].origin).toBeGreaterThanOrEqual(0);

      // Add a new tab in the beginning and select it, expect an origin < than 0 (animate left)
      fixture.componentInstance.tabs.push({label: 'New tab', content: 'to left of index'});
      fixture.componentInstance.selectedIndex = 0;
      fixture.detectChanges();

      tabs = component._tabs.toArray();
      expect(tabs[0].origin).toBeLessThan(0);
    });


    it('should update selected index if the last tab removed while selected', () => {
      fixture.detectChanges();
      const component: MdTabGroup =
          fixture.debugElement.query(By.css('md-tab-group')).componentInstance;

      const numberOfTabs = component._tabs.length;
      fixture.componentInstance.selectedIndex = numberOfTabs - 1;
      fixture.detectChanges();

      // Remove last tab while last tab is selected, expect next tab over to be selected
      fixture.componentInstance.tabs.pop();
      fixture.detectChanges();

      expect(component.selectedIndex).toBe(numberOfTabs - 2);
    });

  });

  describe('async tabs', () => {
    let fixture: ComponentFixture<AsyncTabsTestApp>;

    it('should show tabs when they are available', async(() => {
      fixture = TestBed.createComponent(AsyncTabsTestApp);

      let labels = fixture.debugElement.queryAll(By.css('.mat-tab-label'));

      expect(labels.length).toBe(0);

      fixture.detectChanges();

      fixture.whenStable().then(() => {
        fixture.detectChanges();
        labels = fixture.debugElement.queryAll(By.css('.mat-tab-label'));
        expect(labels.length).toBe(2);
      });
    }));
  });

  describe('with simple api', () => {
    let fixture: ComponentFixture<TabGroupWithSimpleApi>;
    let tabGroup: MdTabGroup;

    beforeEach(() => {
      fixture = TestBed.createComponent(TabGroupWithSimpleApi);
      fixture.detectChanges();

      tabGroup =
          fixture.debugElement.query(By.directive(MdTabGroup)).componentInstance as MdTabGroup;
    });

    it('should support a tab-group with the simple api', () => {
      expect(getSelectedLabel(fixture).textContent).toMatch('Junk food');
      expect(getSelectedContent(fixture).textContent).toMatch('Pizza, fries');

      tabGroup.selectedIndex = 2;
      fixture.detectChanges();

      expect(getSelectedLabel(fixture).textContent).toMatch('Fruit');
      expect(getSelectedContent(fixture).textContent).toMatch('Apples, grapes');

      fixture.componentInstance.otherLabel = 'Chips';
      fixture.componentInstance.otherContent = 'Salt, vinegar';
      fixture.detectChanges();

      expect(getSelectedLabel(fixture).textContent).toMatch('Chips');
      expect(getSelectedContent(fixture).textContent).toMatch('Salt, vinegar');
    });

    it('should support @ViewChild in the tab content', () => {
      expect(fixture.componentInstance.legumes).toBeTruthy();
    });

    it('should support setting the header position', () => {
      let tabGroupNode = fixture.debugElement.query(By.css('md-tab-group')).nativeElement;

      expect(tabGroupNode.classList).not.toContain('mat-tab-group-inverted-header');

      tabGroup.headerPosition = 'below';
      fixture.detectChanges();

      expect(tabGroupNode.classList).toContain('mat-tab-group-inverted-header');
    });
  });

  /**
   * Checks that the `selectedIndex` has been updated; checks that the label and body have their
   * respective `active` classes
   */
  function checkSelectedIndex(expectedIndex: number, fixture: ComponentFixture<any>) {
    fixture.detectChanges();

    let tabComponent: MdTabGroup = fixture.debugElement
        .query(By.css('md-tab-group')).componentInstance;
    expect(tabComponent.selectedIndex).toBe(expectedIndex);

    let tabLabelElement = fixture.debugElement
        .query(By.css(`.mat-tab-label:nth-of-type(${expectedIndex + 1})`)).nativeElement;
    expect(tabLabelElement.classList.contains('mat-tab-label-active')).toBe(true);

    let tabContentElement = fixture.debugElement
        .query(By.css(`md-tab-body:nth-of-type(${expectedIndex + 1})`)).nativeElement;
    expect(tabContentElement.classList.contains('mat-tab-body-active')).toBe(true);
  }

  function getSelectedLabel(fixture: ComponentFixture<any>): HTMLElement {
    return fixture.nativeElement.querySelector('.mat-tab-label-active');
  }

  function getSelectedContent(fixture: ComponentFixture<any>): HTMLElement {
    return fixture.nativeElement.querySelector('.mat-tab-body-active');
  }
});


describe('nested MdTabGroup with enabled animations', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [MdTabsModule, BrowserAnimationsModule],
      declarations: [NestedTabs]
    });

    TestBed.compileComponents();
  }));

  it('should not throw when creating a component with nested tab groups', async(() => {
    expect(() => {
      let fixture = TestBed.createComponent(NestedTabs);
      fixture.detectChanges();
    }).not.toThrow();
  }));
});


@Component({
  template: `
    <md-tab-group class="tab-group"
        [(selectedIndex)]="selectedIndex"
        [headerPosition]="headerPosition"
        [disableRipple]="disableRipple"
        (focusChange)="handleFocus($event)"
        (selectChange)="handleSelection($event)">
      <md-tab>
        <ng-template md-tab-label>Tab One</ng-template>
        Tab one content
      </md-tab>
      <md-tab>
        <ng-template md-tab-label>Tab Two</ng-template>
        Tab two content
      </md-tab>
      <md-tab>
        <ng-template md-tab-label>Tab Three</ng-template>
        Tab three content
      </md-tab>
    </md-tab-group>
  `
})
class SimpleTabsTestApp {
  @ViewChildren(MdTab) tabs: QueryList<MdTab>;
  selectedIndex: number = 1;
  focusEvent: any;
  selectEvent: any;
  disableRipple: boolean = false;
  headerPosition: MdTabHeaderPosition = 'above';
  handleFocus(event: any) {
    this.focusEvent = event;
  }
  handleSelection(event: any) {
    this.selectEvent = event;
  }
}

@Component({
  template: `
    <md-tab-group class="tab-group"
        [(selectedIndex)]="selectedIndex"
        (focusChange)="handleFocus($event)"
        (selectChange)="handleSelection($event)">
      <md-tab *ngFor="let tab of tabs">
        <ng-template md-tab-label>{{tab.label}}</ng-template>
        {{tab.content}}
      </md-tab>
    </md-tab-group>
  `
})
class SimpleDynamicTabsTestApp {
  tabs = [
    {label: 'Label 1', content: 'Content 1'},
    {label: 'Label 2', content: 'Content 2'},
    {label: 'Label 3', content: 'Content 3'},
  ];
  selectedIndex: number = 1;
  focusEvent: any;
  selectEvent: any;
  handleFocus(event: any) {
    this.focusEvent = event;
  }
  handleSelection(event: any) {
    this.selectEvent = event;
  }
}

@Component({
  template: `
    <md-tab-group class="tab-group" [(selectedIndex)]="selectedIndex">
      <md-tab *ngFor="let tab of tabs" label="{{tab.label}}">
        {{tab.content}}
      </md-tab>
    </md-tab-group>
  `
})
class BindedTabsTestApp {
  tabs = [
    { label: 'one', content: 'one' },
    { label: 'two', content: 'two' }
  ];
  selectedIndex = 0;

  addNewActiveTab(): void {
    this.tabs.push({
      label: 'new tab',
      content: 'new content'
    });
    this.selectedIndex = this.tabs.length - 1;
  }
}

@Component({
  selector: 'test-app',
  template: `
    <md-tab-group class="tab-group">
      <md-tab>
        <ng-template md-tab-label>Tab One</ng-template>
        Tab one content
      </md-tab>
      <md-tab disabled>
        <ng-template md-tab-label>Tab Two</ng-template>
        Tab two content
      </md-tab>
      <md-tab>
        <ng-template md-tab-label>Tab Three</ng-template>
        Tab three content
      </md-tab>
    </md-tab-group>
  `,
})
class DisabledTabsTestApp {}

@Component({
  template: `
    <md-tab-group class="tab-group">
      <md-tab *ngFor="let tab of tabs | async">
        <ng-template md-tab-label>{{ tab.label }}</ng-template>
        {{ tab.content }}
      </md-tab>
   </md-tab-group>
  `
})
class AsyncTabsTestApp {
  private _tabs = [
    { label: 'one', content: 'one' },
    { label: 'two', content: 'two' }
  ];

  tabs: Observable<any>;

  ngOnInit() {
    // Use ngOnInit because there is some issue with scheduling the async task in the constructor.
    this.tabs = Observable.create((observer: any) => {
      requestAnimationFrame(() => observer.next(this._tabs));
    });
  }
}


@Component({
  template: `
  <md-tab-group>
    <md-tab label="Junk food"> Pizza, fries </md-tab>
    <md-tab label="Vegetables"> Broccoli, spinach </md-tab>
    <md-tab [label]="otherLabel"> {{otherContent}} </md-tab>
    <md-tab label="Legumes"> <p #legumes>Peanuts</p> </md-tab>
  </md-tab-group>
  `
})
class TabGroupWithSimpleApi {
  otherLabel = 'Fruit';
  otherContent = 'Apples, grapes';
  @ViewChild('legumes') legumes: any;
}


@Component({
  selector: 'nested-tabs',
  template: `
    <md-tab-group>
      <md-tab label="One">Tab one content</md-tab>
      <md-tab label="Two">
        Tab two content
         <md-tab-group [dynamicHeight]="true">
          <md-tab label="Inner tab one">Inner content one</md-tab>
          <md-tab label="Inner tab two">Inner content two</md-tab>
        </md-tab-group>
      </md-tab>
    </md-tab-group>
  `,
})
class NestedTabs {}

