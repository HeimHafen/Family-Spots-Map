// tillaCompanion.js
export class TillaCompanion {
  /**
   * @param {{ getText: (key:string)=>string }} options
   */
  constructor(options) {
    this.getText = options.getText;
    // … setup initial state …
  }

  onLanguageChanged() {
    // … handle language change …
  }

  onFavoriteAdded() {
    // … handle …
  }

  onFavoriteRemoved() {
    // … handle …
  }

  onNoSpotsFound() {
    // … handle …
  }

  onSpotsFound() {
    // … handle …
  }

  onCompassApplied({ travelMode, radiusStep }) {
    // … handle …
  }

  showPlayIdea(idea) {
    // … display idea …
  }
}