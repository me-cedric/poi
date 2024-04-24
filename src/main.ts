import fs from 'fs'
import path from 'path'

export class ApiPoi {
  '@id'!: string // url
  'dc:identifier'!: string
  '@type'!: string[]
  '@rdfs:label'!: {
    fr: string[] // first in array is poi name
  }
  hasContact!: {
    '@id': string // url
    'schema:email': string[] // first in array is mail
    'schema:address': {
      '@id': string // url
      'schema:streetAddress': string[] // first in array is street with number
      'schema:postalCode': string
      'schema:addressLocality': string
    }[] // first in array is address
    'schema:legalName': string // same as @rdfs:label -> fr
    'schema:telephone': string[] // phone and mobile format +33 3 11 11 11 11
    'foaf:homepage': string[] // first in array is website
  }[] // first in array is contact
  'hasDescription'!: {
    '@id': string // url
    'dc:description': {
      fr: string[] // first in array is description
    }
  }[] // first in array is description object with all translations
  isLocatedAt!: {
    '@id': string // url
    'schema:geo': {
      '@id': string // url
      'schema:latitude': string // format "48.450138";
      'schema:longitude': string // format "4.5111042";
    }
  }[] // first in array is location block for geometry
  hasMainRepresentation!: {
    '@id': string // url
    'ebucore:hasRelatedResource': {
      '@id': string // url
      'ebucore:locator': string // pictures url;
    }
  }[] // first in array is location block for geometry

  constructor(poi: Partial<ApiPoi>) {
    Object.assign(this, poi)
  }
}

export class NaviPoi {
  type!: string // "Feature"
  id!: string // "TOURISTIC_556"
  properties!: {
    marker_type: string // "TOURISTIC"
    id: string // "78462137556"
    name: string // "Musée d'Orsay"
    touristic_type: string // "museum"
    description: string // "Le Musée d'Orsay est un musée national situé à Paris, France. Il abrite une collection d'art impressionniste et post-impressionniste, ainsi que des œuvres majeures de l'art moderne et contemporain."
    contact: {
      name: string // "Musée d'Orsay"
      phone: string // "+33 1 40 49 48 14"
      address: string // "1 Rue de la Légion d'Honneur, 75007 Paris"
      web: string // "https://www.musee-orsay.fr/"
    }
    start_date: string // "2024-01-01T00:00:00Z"
    end_date: string // "2024-12-31T23:59:59Z"
    pictures: string // "https://www.musee-orsay.fr/sites/default/files/styles/strip__third___small/public/2020-02/musee_orsay2_credit_jeanluc_olivie.jpg"
  }
  geometry!: {
    type: string // "Point"
    coordinates: number[] // [2.326944, 48.859722]
  }

  static fromApiPoi(apiPoi: ApiPoi) {
    return new NaviPoi({
      type: 'Feature',
      id: apiPoi['dc:identifier'],
      properties: {
        marker_type: apiPoi['@type']?.[0],
        id: apiPoi['dc:identifier'],
        name: apiPoi['@rdfs:label']?.fr?.[0],
        touristic_type: apiPoi['@type']?.[1],
        description: apiPoi.hasDescription?.[0]?.['dc:description']?.fr?.[0],
        contact: {
          name: apiPoi.hasContact?.[0]?.['schema:legalName'],
          phone: apiPoi.hasContact?.[0]?.['schema:telephone']?.[0],
          address:
            apiPoi.hasContact?.[0]?.['schema:address']?.[0]?.[
              'schema:streetAddress'
            ]?.[0],
          web: apiPoi.hasContact?.[0]?.['foaf:homepage']?.[0]
        },
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-12-31T23:59:59Z',
        pictures:
          apiPoi.hasMainRepresentation?.[0]?.['ebucore:hasRelatedResource']?.[
            'ebucore:locator'
          ]
      },
      geometry: {
        type: 'Point',
        coordinates: [
          parseFloat(
            apiPoi.isLocatedAt?.[0]?.['schema:geo']?.['schema:longitude']
          ),
          parseFloat(
            apiPoi.isLocatedAt?.[0]?.['schema:geo']?.['schema:latitude']
          )
        ]
      }
    })
  }

  constructor(poi?: Partial<NaviPoi>) {
    Object.assign(this, poi)
  }
}

export class PoiCollection {
  type!: 'FeatureCollection'
  features!: NaviPoi[]
  properties!: {
    has_more: false
  }

  constructor(poiCollection?: Partial<PoiCollection>) {
    Object.assign(this, poiCollection)
  }
}

const main = () => {
  const jsonsInDir = fs
    .readdirSync('./json')
    .filter((file: string) => path.extname(file) === '.json')

  const poiCollection: PoiCollection = new PoiCollection({
    type: 'FeatureCollection',
    features: [],
    properties: {
      has_more: false
    }
  })

  jsonsInDir.forEach((file) => {
    const fileData = fs.readFileSync(path.join('./json', file))
    const json = JSON.parse(fileData.toString())
    const apiPoi = new ApiPoi(json)
    poiCollection.features.push(NaviPoi.fromApiPoi(apiPoi))
  })
  var json = JSON.stringify(poiCollection)
  fs.writeFile('./out/navi-poi-collection.json', json, 'utf8', () =>
    console.log('file written successfully at ./out/navi-poi-collection.json')
  )
}

main()
