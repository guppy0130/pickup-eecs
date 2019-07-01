# Pickup-EECS

## Corny EECS-related pickup lines API

### Installation

```bash
git clone git@git{lab.hub}.com:guppy0130/pickup-eecs.git # clone project
npm i # install dependencies
npm start # start server
```

Please lint before committing `:(`

### Completed

* poor frontend at `/`
* api response at `/api` for all programmatic needs
* responses read in from `/data.txt`
* tagging

### Todo

* `/add` endpoint UI

### Tagging/Data Structure

```javascript
data.lines = {
    tag1: [line1, line2, line3],
    tag2: [line2, line3],
    tag3: [line1, line2]
}
```

A request with multiple tags returns the intersection of those tags.