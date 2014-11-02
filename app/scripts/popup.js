'use strict';

var items        = document.getElementById('items');
var autocomplete = document.getElementById('autocomplete');

function createIcon (iconUrl) {
  var el  = document.createElement('span');
  var ico = document.createElement('img');
  if (!iconUrl) { return el; }
  ico.src = iconUrl;
  ico.alt = iconUrl;
  el.classList.add('icon');
  el.appendChild(ico);
  return el;
}

function createTitle (title) {
  var el = document.createElement('span');
  el.classList.add('title');
  el.innerText = title;
  return el;
}

function createItem (tab) {
  var el = document.createElement('li');
  el.appendChild(createIcon(tab.favIconUrl));
  el.appendChild(createTitle(tab.title));
  el.id = tab.id;
  return el;
}

/**
 * Checks if the current tab value matches the filter value.
 * It will check for both the title and the url.
 */
function filterTab (value, tab) {
  if (!value) { return true; }
  return [ tab.title, tab.url ].some(function(item) {
    return !!~item.toLowerCase().indexOf(value.toLowerCase());
  });
}

/**
 * Renders and re-renders the list of items.
 * First removes all the children
 * Then builds the list again and attaches tabindexes for tab controls
 */
function renderItems (tabs, filterValue) {
  var itemsList = tabs.filter(filterTab.bind(null, filterValue)).map(createItem);

  // Clear all the items
  while (items.firstChild) {
    items.removeChild(items.firstChild);
  }

  itemsList.forEach(function(item, id) {
    // The first tabindex is autocomplete and thats 1
    // so we need to make sure that all tab items will be ordered after that
    item.tabIndex = id + 2;
    items.appendChild(item);
  });
}

/**
 * Selects the given tab with the id
 * and closes the popup.
 */
function selectTab (id) {
  chrome.tabs.update(+id, {
    active: true
  });
  window.close();
}

chrome.tabs.getAllInWindow(null, function(tabs) {
  renderItems(tabs);

  items.addEventListener('click', function(e) {
    var id = e.target.id;
    selectTab(id);
    e.preventDefault();
  });

  items.addEventListener('keydown', function(e) {
    var id = +e.target.id;
    if (e.keyCode === 13) { selectTab(id); }

    // 40 = down
    // 38 = up
    // If the user presses up or down keys then lets see if we have the following index available
    // If we do then focus that
    else {
      // Find current items index
      var index = tabs.reduce(function(old, item, index) {
        return item.id === id ? index : old;
      }, -1);

      if (e.keyCode === 40 && tabs[index + 1]) {
        var next = tabs[index + 1].id;
        document.getElementById(next).focus();
      } else if (e.keyCode === 38 && tabs[index - 1]) {
        var prev = tabs[index - 1].id;
        document.getElementById(prev).focus();
      }
    }
  });

  autocomplete.addEventListener('keyup', function(e) {
    var value = e.target.value.toLowerCase();

    // Check if we have any elements in the list
    if (items.firstElementChild) {
      // If enter is pressed and there is a first element
      // then focus the given element
      if (e.keyCode === 13) {
        // If there is only one child then select the given one
        if (items.childElementCount === 1) {
          return selectTab(items.firstElementChild.id);
        }
        return items.firstElementChild.focus();
      }

      // If down arrow is pressed then select the next element
      else if (e.keyCode === 40) {
        return items.firstElementChild.focus();
      }
    }

    renderItems(tabs, value);
  });
});
