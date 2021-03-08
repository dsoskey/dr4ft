import capitalize from "lodash/capitalize";
import { SortType } from "./app";
import { Card } from 'common/src/types/card'

export const toTitleCase = (sentence: string = '', separator=" ") => {
  const words = sentence.split(separator);
  const capitalized = words.map(capitalize);
  return capitalized.join(separator);
};

export default {
  toTitleCase,
  download(data: string, filename: string) {
    // XXX this is browser only, maybe extract?
    let link = document.createElement('a')
    link.download = filename
    link.href = `data:,${encodeURIComponent(data)}`
    document.body.appendChild(link)
    link.click()
    link.remove()
  },

  add(src: any, dst: any) {
    for (let key in src) {
      dst[key] || (dst[key] = 0)
      dst[key] += src[key]
    }
  },
  pad(len: number, c: string, s: string | number) {
    s = '' + s
    let prefix = c.repeat(len - s.length)
    return prefix + s
  },
  seq(index: number, end: number) {
    let arr = []
    while (index >= end)
      arr.push(index--)
    return arr
  },
  group(arr: Card[], attr: SortType): { [key: string]: Card[] } {
    let groups: { [key: string]: Card[] }  = {}
    for (let item of arr) {
      let key = item[attr]
      if (groups[key] === undefined) {
        groups[key] = []
      }
      groups[key].push(item)
    }
    return groups
  },
  sort(arr: any[], ...attrs: any[]) {
    arr.sort((a,b) => {
      for (let attr of attrs) {
        if (typeof attr === 'function') {
          let order = attr(a, b)
          if (order !== 0)
            return order
        } else {
          if (a[attr] > b[attr])
            return 1
          if (a[attr] < b[attr])
            return -1
        }
      }
      return 0
    })
  },
  values(obj: any) {
    let vals = []
    for (let key in obj)
      vals.push(obj[key])
    return vals
  },
  uid() {
    return Math.random().toString(36).slice(2)
  }
};
