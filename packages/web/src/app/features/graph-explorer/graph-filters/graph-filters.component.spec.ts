import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GraphFiltersComponent } from "./graph-filters.component";
import {
  defaultGraphFilters,
  EXPLORER_NODE_TYPES,
} from "../../../core/models/graph-filters.model";

describe("GraphFiltersComponent", () => {
  let fixture: ComponentFixture<GraphFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraphFiltersComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(GraphFiltersComponent);
    fixture.componentRef.setInput("state", defaultGraphFilters());
    fixture.detectChanges();
  });

  it("renders node type checkboxes", () => {
    const text = fixture.nativeElement.textContent as string;
    for (const t of EXPLORER_NODE_TYPES.slice(0, 3)) {
      expect(text).toContain(t);
    }
  });

  it("emits filtersChange when toggling hide structure", () => {
    const spy = jasmine.createSpy("filtersChange");
    fixture.componentInstance.filtersChange.subscribe(spy);
    fixture.componentInstance.onHideStructure(false);
    expect(spy).toHaveBeenCalled();
    const next = spy.calls.mostRecent().args[0] as { hideStructure: boolean };
    expect(next.hideStructure).toBe(false);
  });

  it("emits reload on button click", () => {
    const spy = jasmine.createSpy("reload");
    fixture.componentInstance.reload.subscribe(spy);
    const reloadBtn = fixture.nativeElement.querySelector(
      'button[mat-flat-button]',
    ) as HTMLButtonElement;
    reloadBtn.click();
    expect(spy).toHaveBeenCalled();
  });
});
