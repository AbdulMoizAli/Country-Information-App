function getCountriesData(url, callback) {
    fetch(url)
        .then(response => {
            if (response.ok) {
                return response.json();
            }

            throw new Error('Something Went Wrong!');
        })
        .then(data => callback(data))
        .catch(error => console.log(error));
}

function getCountryData(countryName, callback) {
    let data;

    fetch(`https://restcountries.com/v2/name/${countryName}?fullText=true`)
        .then(response => {
            if (response.ok) {
                return response.json();
            }

            throw new Error('Something Went Wrong!');
        })
        .then(countryData => {
            if (countryData[0].borders.length == 0) {
                callback(countryData, []);
            } else {
                data = countryData;
                return fetch(
                    `https://restcountries.com/v2/alpha?codes=${countryData[0].borders
                        .join()
                        .replace(/,/g, ';')}`
                );
            }
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            }

            throw new Error('Something Went Wrong!');
        })
        .then(countries => callback(data, countries))
        .catch(error => console.log(error));
}

const suggestions = {};

function makeHttpRequest(e) {
    if (suggestions[e] === null) {
        getCountriesData(
            `https://restcountries.com/v2/region/${e}`,
            viewCountries
        );
    } else {
        if (e.includes('|')) {
            const start = e.indexOf('|') + 2;
            const end = e.indexOf('|', start) - 1;
            e = e.slice(start, end);
        }
        getCountryData(e, viewCountryInfo);
    }
}

function loadSuggestions(countries) {
    countries.forEach(country => {
        const { name, capital, flag, region } = country;
        suggestions[name] = flag;
        if (suggestions[region] === undefined && region !== '') {
            suggestions[region] = null;
        }
        if (capital !== '') {
            suggestions[`${capital} | ${name} |`] = flag;
        }
    });

    const options = {
        data: suggestions,
        onAutocomplete: makeHttpRequest,
        limit: 5,
    };

    const elem = document.querySelector('.autocomplete');
    M.Autocomplete.init(elem, options);

    const mostPopulousCountries = countries
        .sort((a, b) => b.population - a.population)
        .slice(0, 10)
        .map(country => {
            return {
                name: country.name,
                flag: country.flag,
                population: country.population,
            };
        });

    const mostLargestCountries = countries
        .sort((a, b) => b.area - a.area)
        .slice(0, 10)
        .map(country => {
            return {
                name: country.name,
                flag: country.flag,
                area: country.area,
            };
        });

    viewMostPopulousAndLargestCountries(
        mostPopulousCountries,
        mostLargestCountries
    );
}

const image = document.querySelector('#flag');
const mainContent = document.querySelector('#main-info');
const inputText = document.querySelector('#inputValue');

function numFormatter(num) {
    const result = [];
    result.push(num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,'));

    if (num > 999 && num < 1000000) {
        result.push((num / 1000).toFixed(2) + 'K');
    } else if (num > 1000000) {
        result.push((num / 1000000).toFixed(2) + 'M');
    } else if (num < 900) {
        result.push(num);
    }

    return result;
}

function viewMostPopulousAndLargestCountries(
    populousCountries,
    largestCountries
) {
    let populationList = '';
    populousCountries.forEach(country => {
        let { name, flag, population } = country;
        population = numFormatter(population);

        populationList += `
        <li class="collection-item avatar grey lighten-4">
            <img src=${flag} class="circle">
            <span id="border-item" class="title">${name}</span>
            <div><big>${population[0]} ( ${population[1]} )</big></div>
        </li>
        `;
    });

    const populationOutput = `
        <div class="col l6 s12 m12">
            <h5 class="grey-text text-darken-2 animate__animated animate__fadeInLeft"><u>Top 10 Most Populous Countries</u></h5>
            <canvas id="populationCanvas" height="350"></canvas>
            <ul class="collection z-depth-1 animate__animated animate__fadeInLeft">
                ${populationList}
            </ul>
        </div>
    `;

    let areaList = '';
    largestCountries.forEach(country => {
        let { name, flag, area } = country;
        area = numFormatter(area);

        areaList += `
        <li class="collection-item avatar grey lighten-4">
            <img src=${flag} class="circle">
            <span id="border-item" class="title">${name}</span>
            <div><big>${area[0]}km²</big></div>
        </li>
        `;
    });

    const largestOutput = `
    <div class="col l6 s12 m12">
            <h5 class="grey-text text-darken-2 animate__animated animate__fadeInRight"><u>Top 10 Most Largest Countries</u></h5>
            <canvas id="areaCanvas" height="350"></canvas>
            <ul class="collection z-depth-1 animate__animated animate__fadeInRight">
                ${areaList}
            </ul>
        </div>
    `;

    mainContent.innerHTML = `
    <div class="row">
    ${populationOutput}
    ${largestOutput}
    </div>
    `;

    bindEvents();

    populousCountries = populousCountries.map(country => {
        return {
            name: country.name,
            population: country.population,
        };
    });

    largestCountries = largestCountries.map(country => {
        return {
            name: country.name,
            area: country.area,
        };
    });

    viewMostPopulousAndLargestCountriesChart(
        populousCountries,
        largestCountries
    );
}

function viewMostPopulousAndLargestCountriesChart(
    populousCountries,
    largestCountries
) {
    const populationCanvas = document
        .querySelector('#populationCanvas')
        .getContext('2d');
    const areaCanvas = document.querySelector('#areaCanvas').getContext('2d');

    const populationChartObject = {
        type: 'bar',
        data: {
            labels: populousCountries.map(country => {
                return country.name;
            }),
            datasets: [
                {
                    label: 'POPULATION',
                    backgroundColor: '#b2dfdb',
                    borderColor: '#4db6ac',
                    borderWidth: 1,
                    data: populousCountries.map(country => {
                        return country.population;
                    }),
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
        },
    };

    const areaChartObject = {
        type: 'bar',
        data: {
            labels: largestCountries.map(country => {
                return country.name;
            }),
            datasets: [
                {
                    label: 'AREA',
                    backgroundColor: '#b2dfdb',
                    borderColor: '#4db6ac',
                    borderWidth: 1,
                    data: largestCountries.map(country => {
                        return country.area;
                    }),
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                yAxes: [
                    {
                        ticks: {
                            callback: function (value, index, valies) {
                                return value + 'km²';
                            },
                        },
                    },
                ],
            },
        },
    };

    const populationChart = new Chart(populationCanvas, populationChartObject);
    const areaChart = new Chart(areaCanvas, areaChartObject);
}

function viewCountryInfo(countries, landBorders) {
    let {
        flag,
        name: commonName,
        nativeName,
        altSpellings: otherNames,
        translations,
        languages,
        population,
        topLevelDomain,
        alpha2Code,
        alpha3Code,
        callingCodes,
        timezones,
        numericCode,
        currencies,
        cioc,
        gini,
        region,
        subregion,
        capital,
        latlng: latitudeLongitude,
        demonym,
        area,
        regionalBlocs: regionalBlocks,
    } = countries[0];

    const flagImage = `
    <img src="${flag}" width="50%" height="50%" class="animate__animated animate__fadeInRight z-depth-1">
    `;

    otherNames = otherNames
        .map(otherName => {
            return `
        <li class="collection-item grey lighten-4" style="border: 0;">${otherName}</li>
        `;
        })
        .join()
        .replace(/,/g, '');

    translations = Object.keys(translations)
        .map(key => {
            return `
        <tr>
            <th class="grey lighten-3 grey-text text-darken-1">${key}</th>
            <td class="grey lighten-4">${translations[key]}</td>
        </tr>
        `;
        })
        .join()
        .replace(/,/g, '');

    const namesTable = `
    <table class="animate__animated animate__fadeInLeft">
        <tbody>
            <tr>
                <th class="grey lighten-3 grey-text text-darken-1">Common Name</th>
                <td class="grey lighten-4">${commonName}</td>
            </tr>
            <tr>
                <th class="grey lighten-3 grey-text text-darken-1">Native Name</th>
                <td class="grey lighten-4">${nativeName}</td>
            </tr>
            <tr>
                <th class="grey lighten-3 grey-text text-darken-1">Other Names</th>
                <td class="grey lighten-4"><ul class="collection" style="border: 0;">${otherNames}</ul></td>
            </tr>
            <tr>
                <th class="grey lighten-3 grey-text text-darken-1">Translations</th>
            </tr>
            ${translations}
        </tbody>
    </table>
    `;

    population = numFormatter(population);

    languages = languages
        .map(language => {
            return `
        <tr>
            <th class="grey lighten-3 grey-text text-darken-1">${language['iso639_2']}</th>
            <td class="grey lighten-4">${language['nativeName']} ( ${language['name']} )</td>
        </tr>
        `;
        })
        .join()
        .replace(/,/g, '');

    const languagesTable = `
    <table class="animate__animated animate__fadeInLeft">
        <tbody>
            ${languages}
            <tr>
                <th class="grey lighten-3 grey-text text-darken-1">Population</th>
                <td class="grey lighten-4">${population[0]} ( ${population[1]} )</td>
            </tr>
        </tbody>
    </table>
    `;

    topLevelDomain = topLevelDomain.join(', ');
    callingCodes = callingCodes.join(', ');
    timezones = timezones
        .map(timeZone => {
            return `
        <li class="collection-item grey lighten-4" style="border: 0;">${timeZone}</li>
        `;
        })
        .join()
        .replace(/,/g, '');

    let currencyCode = '';
    let currencyName = '';
    let currencySymbol = '';

    currencies.forEach(currency => {
        currencyCode += `
        <li class="collection-item grey lighten-4" style="border: 0;">${currency.code}</li>
        `;
        currencyName += `
        <li class="collection-item grey lighten-4" style="border: 0;">${currency.name}</li>
        `;
        currencySymbol += `
        <li class="collection-item grey lighten-4" style="border: 0;">${currency.symbol}</li>
        `;
    });

    const codesTable = `
    <table class="animate__animated animate__fadeInRight">
        <tbody>
            <tr>
                <th class="grey lighten-3 grey-text text-darken-1">ISO 3166-1 Alpha-2</th>
                <td class="grey lighten-4">${alpha2Code}</td>
            </tr>
            <tr>
                <th class="grey lighten-3 grey-text text-darken-1">ISO 3166-1 Alpha-3</th>
                <td class="grey lighten-4">${alpha3Code}</td>
            </tr>
            <tr>
                <th class="grey lighten-3 grey-text text-darken-1">CIOC</th>
                <td class="grey lighten-4">${cioc}</td>
            </tr>
            <tr>
                <th class="grey lighten-3 grey-text text-darken-1">Top Level Domain</th>
                <td class="grey lighten-4">${topLevelDomain}</td>
            </tr>
            <tr>
                <th class="grey lighten-3 grey-text text-darken-1">ISO 3166-1 Numeric</th>
                <td class="grey lighten-4">${numericCode}</td>
            </tr>
            <tr>
                <th class="grey lighten-3 grey-text text-darken-1">GINI</th>
                <td class="grey lighten-4">${gini === null ? '' : gini}</td>
            </tr>
            <tr>
                <th class="grey lighten-3 grey-text text-darken-1">International Calling Code</th>
                <td class="grey lighten-4">${callingCodes}</td>
            </tr>
            <tr>
                <th class="grey lighten-3 grey-text text-darken-1">Time Zone</th>
                <td class="grey lighten-4"><ul class="collection" style="border: 0;">${timezones}</ul></td>
            </tr>
            <tr>
                <th class="grey lighten-3 grey-text text-darken-1">Currency</th>
            </tr>
            <tr>
                <th class="grey lighten-3 grey-text text-darken-1">Code</th>
                <td class="grey lighten-4"><ul class="collection" style="border: 0;">${currencyCode}</ul></td>
            </tr>
            <tr>
                <th class="grey lighten-3 grey-text text-darken-1">Name</th>
                <td class="grey lighten-4"><ul class="collection" style="border: 0;">${currencyName}</ul></td>
            </tr>
            <tr>
                <th class="grey lighten-3 grey-text text-darken-1">Symbol</th>
                <td class="grey lighten-4"><ul class="collection" style="border: 0;">${currencySymbol}</ul></td>
            </tr>
        </tbody>
    </table>
    `;

    const [lat, lng] = latitudeLongitude;

    landBorders = landBorders
        .map(border => {
            return `
        <li class="collection-item avatar grey lighten-4" style="border: 0;">
            <img src="${border.flag}" class="circle">
            <span id="border-item" class="title">${border.name}</span>
        </li>
        `;
        })
        .join()
        .replace(/,/g, '');

    let regionalAcronym = '';
    let regionalName = '';

    regionalBlocks.forEach(block => {
        regionalAcronym += `
        <li class="collection-item grey lighten-4" style="border: 0;">${block.acronym}</li>
        `;
        regionalName += `
        <li class="collection-item grey lighten-4" style="border: 0;">${block.name}</li>
        `;
    });

    regionalAcronym = regionalAcronym.slice(0, -2);
    regionalName = regionalName.slice(0, -2);

    const geographyTable = `
    <table class="animate__animated animate__fadeInRight">
        <tbody>
            <tr>
                <th class="grey lighten-3 grey-text text-darken-1">Region</th>
                <td class="grey lighten-4">${region}</td>
            </tr>
            <tr>
                <th class="grey lighten-3 grey-text text-darken-1">Subregion</th>
                <td class="grey lighten-4">${subregion}</td>
            </tr>
            <tr>
                <th class="grey lighten-3 grey-text text-darken-1">Capital City</th>
                <td class="grey lighten-4">${capital}</td>
            </tr>
            <tr>
                <th class="grey lighten-3 grey-text text-darken-1">Demonym</th>
                <td class="grey lighten-4">${demonym}</td>
            </tr>
            <tr>
                <th class="grey lighten-3 grey-text text-darken-1">Lat/Lng</th>
                <td>
                    <center>
                        <a href="https://www.openstreetmap.org/#map=5/${lat}/${lng}" target="_blank" class="btn pulse teal lighten-2">
                            <i class="material-icons right">map</i>${lat.toFixed(
                                2
                            )}, ${lng.toFixed(2)}
                        </a>
                    </center>
                </td>
            </tr>
            <tr>
                <th class="grey lighten-3 grey-text text-darken-1">Area</th>
                <td class="grey lighten-4">${numFormatter(area)[0]}km²</td>
            </tr>
            <tr>
                <th class="grey lighten-3 grey-text text-darken-1">Land Borders</th>
                <td class="grey lighten-4"><ul class="collection" style="border: 0;">${landBorders}</ul></td>
            </tr>
            <tr>
                <th class="grey lighten-3 grey-text text-darken-1">Regional Block</th>
            </tr>
            <tr>
                <th class="grey lighten-3 grey-text text-darken-1">Acronym</th>
                <td class="grey lighten-4"><ul class="collection" style="border: 0;">${regionalAcronym}</ul></td>
            </tr>
            <tr>
                <th class="grey lighten-3 grey-text text-darken-1">Name</th>
                <td class="grey lighten-4"><ul class="collection" style="border: 0;">${regionalName}</ul></td>
            </tr>
        </tbody>
    </table>
    `;

    const output = `
    <div class="row">
        <div class="col l6 m12 s12">
            <h4 class="grey-text text-darken-2"><u>Names</u></h4>
            ${namesTable}
            <h4 class="grey-text text-darken-2"><u>Languages</u></h4>
            ${languagesTable}
        </div>
        <div class="col l6 m12 s12">
            <h4 class="grey-text text-darken-2"><u>Codes</u></h4>
            ${codesTable}
            <h4 class="grey-text text-darken-2"><u>Geography</u></h4>
            ${geographyTable}
        </div>
    </div>
    `;

    image.innerHTML = flagImage;
    mainContent.innerHTML = output;

    bindEvents();
}

function viewCountries(countries) {
    let list = '';
    countries.forEach(country => {
        const { name, flag } = country;

        list += `
        <li class="collection-item avatar grey lighten-4">
            <img src=${flag} class="circle">
            <span id="border-item" class="title">${name}</span>
        </li>
        `;
    });

    const output = `
    <div class="row">
        <div class="col l12 s12 m12">
            <ul class="collection with-header z-depth-1 hoverable animate__animated animate__fadeInLeft">
                <li class="collection-header grey lighten-3"><h5 class="grey-text text-darken-2">List of Countries in ${inputText.value}<h5>( ${countries.length} )</h5></h5></li>
                ${list}
            </ul>
        </div>
    </div>
    `;

    if (image.children.length) {
        const source = image.children[0].src;
        image.innerHTML = `
        <img src="${source}" width="50%" height="50%" class="animate__animated animate__fadeOutRight">
        `;
        setTimeout(() => {
            image.innerHTML = null;
            mainContent.innerHTML = output;
            bindEvents();
        }, 1000);
    } else {
        mainContent.innerHTML = output;
        bindEvents();
    }
}

function bindEvents() {
    const borderList = document.querySelectorAll('#border-item');
    borderList.forEach(border => {
        border.addEventListener('click', e => {
            const name = e.srcElement.innerText;
            makeHttpRequest(name);
            document.documentElement.scrollTop = 0;
            inputText.focus();
            inputText.value = name;
        });
    });
}

window.addEventListener('load', () => {
    const date = new Date().getFullYear();
    document.querySelector(
        '#copyright'
    ).textContent = `Copyright © ${date} Abdul Moiz`;
});

getCountriesData('https://restcountries.com/v2/all', loadSuggestions);
