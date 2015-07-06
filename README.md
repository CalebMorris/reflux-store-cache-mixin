# reflux-store-cache-mixin

Reflux mixin for caching data.

Main usage is to reduce network calls for slowly changing data

# Example

```javascript

// Actions
import Reflux from 'reflux';

const testActions = Reflux.createActions({
  fetch: {
    children : [ 'completed', 'failed' ],
  },
});

export default testActions;

// Store
import Reflux from 'reflux';
import StoreCacheMixin from 'reflux-store-cache-mixin';
import { Map } from 'immutable';

export default Reflux.createStore({
  listenables : testActions,

  data : new Map(),

  mixins : [ StoreCacheMixin ],

  onFetch() {
    const data = this.fetchData('data', '*');

    if (! data) {
      return fetchData()
        .then((nextData) => {
          this.data = nextData;
          return this.trigger(this.data);
        });
    }

    return this.trigger(this.data);
  },
});


```
