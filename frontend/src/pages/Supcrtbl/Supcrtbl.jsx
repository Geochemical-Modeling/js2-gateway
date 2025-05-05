import React from 'react';
import { Link } from 'react-router-dom';
import { route_map } from '../../constants';

import './Supcrtbl.css';

const databaseChanges = [
  {
    title: 'SUPCRT96.dat',
    sections: [
      {
        title: 'Aqueous Species',
        items: [
          'Al-bearing species and NaOH from Pokrovskii and Helgeson (1995).',
          'Metal-organic complexes and other organic compounds from Haas *et al.* (1995); and references therein.',
          'Palladium from Sassani and Shock (1998).',
          'All other species from Sverjensky *et al.* (1997) and those internally consistent to Sverjensky *et al.* (1997) in earlier Helgeson and co-workers’ publications.',
        ],
      },
      {
        title: 'Minerals',
        items: [
          'Al oxyhydroxides from Pokrovskii and Helgeson (1995); all others from Helgeson *et al.* (1978).',
        ],
      },
    ],
  },
  {
    title: 'SLOP98.dat',
    sections: [
      {
        title: 'Aqueous Species',
        items: [
          'Al-bearing species, from Shock et al. (1997b).',
          'Metal-organic complexes and other organic compounds from Haas et al. (1995); and references therein.',
          'Uranium from Shock et al. (1997a); Platinum-Group from Sassani and Shock (1998).',
          'All other species from Sverjensky et al. (1997) and those internally consistent to Sverjensky et al. (1997) in earlier Helgeson and co-workers’ publications',
        ],
      },
      {
        title: 'Minerals',
        items: ['Helgeson et al. (1978).'],
      },
    ],
  },
  {
    title: 'SLOP07.dat',
    sections: [
      {
        title: 'Aqueous Species',
        items: [
          'Al-bearing species, from Shock et al. (1997b).',
          'Metal-organic complexes and other organic compounds from Shock (2009); and references therein.',
          'Uranium from Shock et al. (1997a); Platinum-Group from Sassani and Shock (1998); Actinides from Murphy and Shock (1999).',
          'All other species from Sverjensky et al. (1997) and those internally consistent to Sverjensky et al. (1997) in earlier Helgeson and co-workers’ publications.',
        ],
      },
      {
        title: 'Minerals',
        items: ['Helgeson et al. (1978).'],
      },
    ],
  },
  {
    title: 'Supcrtbl.dat',
    sections: [
      {
        title: 'Aqueous Species',
        items: [
          'Al-bearing species from Tagirov and Schott (2001).',
          'Metal-organic complexes and other organic compounds from Dale et al. (1997); and references therein.',
          'SiO₂ and HSiO₃⁻ from Apps and Spycher (2004), Stefansson (2001).',
          'As-bearing species from Nordstrom and Archer (2002) Metal-arsenate and metal-arsenite aqueous complexes from Marini and Accornero (2010).',
          'All other species from Sverjensky et al. (1997) and those internally consistent to Sverjensky et al. (1997) in earlier Helgeson and co-workers’ publications.',
        ],
      },
      {
        title: 'Minerals',
        items: [
          'Holland and Powell (2011); Boehmite from Hemingway et al. (1991); Gibbsite from Robie et al. (1978); Dawsonite from this study; Arsenopyrite from Ball and Nordstrom (1991); Scorodite and Ferric-As,am from Langmuir et al. (2006); Barium-As and Barium-H-As from Zhu et al. (2005); all other As-bearing solids from Nordstrom and Archer (2002).',
        ],
      },
    ],
  },
];

/**
 * ### Supcrtbl ("Super-Crit-Table")
 * Disclaimer and information page for the online super crit application.
 *
 */
export default function Supcrtbl() {
  return (
    <main
      id="main-content"
      className="rvt-layout__wrapper rvt-layout__wrapper--single rvt-container-sm"
    >
      <div className="rvt-layout__content">
        <header>
          <h2 className="rvt-ts-lg rvt-text-medium">
            Introduction to SUPCRTBL (sᴜᴘᴄʀᴛ - Bloomington)
          </h2>
          <Link to={route_map.SUPCRTBL_ONLINE} className="App-links__item">
            Online Version of Supcrtbl
          </Link>
        </header>

        <section>
          <p>
            sᴜᴘᴄʀᴛ is a software package to calculate thermodynamic properties
            for minerals, gases, aqueous species, and reactions at high
            temperatures and pressures. It is a FORTRAN program written
            originally by students and associates of Professor H.C. Helgeson at
            the University of California - Berkeley and was updated by Jim W.
            Johnson, Eric H Oelkers and Everett Shock up to 1992 (Johnson et
            al., 1992). The original program uses the internally consistent
            database of minerals and gases from Helgeson et al. (1978). The
            Maier-Kelley heat capacity formulation was used for minerals.
          </p>
          <p>
            For this version of sᴜᴘᴄʀᴛ (sᴜᴘᴄʀᴛʙʟ), we used a more recent mineral
            database of Holland and Powell (2011) and modified the computer code
            accordingly to accommodate the different heat capacity function,
            volume as a function of temperature and pressure, and mineral phase
            transition using the Landau model (Holland and Powell, 1998). We
            also added more species to the database. These include rare earth
            element minerals and solids (Pan, Zhu, and others, 2024), arsenic
            minerals and aqueous species, aluminum species from Tagirov and
            Schott (2001), aqueous silica from Apps and Spycher (2004) and
            Stefasson (2001), and dawsonite from Benezeth et al. (2007). The
            stated temperature and pressure ranges for aqueous species are from
            1 to 5000 bars and 0° to 1000°C; for minerals the ranges exceed the
            original limits stated in Johnson et al. (1992); but vary for
            individual species. Please check carefully.
          </p>
          <p>
            Please refer the following article when you use of the sᴜᴘᴄʀᴛʙʟ code
            and accompanying database:
          </p>
          <p className="references">
            Zimmer, K., Zhang, Y.L., Lu, P., Chen, Y.Y., Zhang, G.R., Dalkilic,
            M. and Zhu, C. (2016) SUPCRTBL: A revised and extended thermodynamic
            dataset and software package of SUPCRT92.{' '}
            <em>Computer and Geosciences</em> 90:97-111.
            <a href="https://www.sciencedirect.com/science/article/pii/S0098300416300371?via%3Dihub">
              DOI
            </a>
          </p>
          <p>
            We strongly recommend citing together with Johnson et al. (1992)
            when using sᴜᴘᴄʀᴛʙʟ:
          </p>
          <p className="references">
            Johnson, J.W., Oelkers, E.H. and Helgeson, H.C. (1992) SUPCRT92 - A
            software package for calculating the standard molal thermodynamic
            properties of minerals, gases, aqueous species, and reactions from
            1-bar to 5000-bar and 0°C to 1000°C. Computer and Geosciences
            18:899-947.
          </p>

          <p>
            The computer code and database presented here was put together by
            many of Zhu’s students over several years: Peng Lu (now at Saudi
            Aramco), Yanyan Chen (now at Petro China), Guanru Zhang (now a
            professor at Chengdu Univ. of Technology), Kurt Zimmer (now a Data
            Science Manager at Wayfair), Yilun Zhang (now a senior scientist at
            InterTek environmental services), and undergrads in the Luddy School
            of Informatics, Computing, and Engineering (Kevin Tu, Rob Hageboeck,
            Ranvir Virk Singh). Many parts are untested, and the users assume
            all responsibilities. We will continue making corrections. Kindly
            send comments and corrections to Chen Zhu at{' '}
            <a href="mailto:supcrt@iu.edu">supcrt@iu.edu.</a>
          </p>
          <p>
            There is no Mac version of sᴜᴘᴄʀᴛ due to issues compiling Fortran to
            the many different versions of OSX, please use the online version
            instead.
          </p>
        </section>

        <br />

        <section>
          <header className="rvt-m-bottom-sm rvt-text-center">
            <h2 className="rvt-text-medium rvt-ts-md">
              List of changes in databases (Table 4)
            </h2>
          </header>

          {/* For some reason the styles stopped styling */}
          <div className="card-grid">
            {databaseChanges.map((block, blockIndex) => (
              <div className="rvt-card" key={blockIndex}>
                <div className="rvt-card__body" key={blockIndex}>
                  <h2 className="rvt-card__title rvt-text-center rvt-text-uppercase rvt-text-medium">
                    {block.title}
                  </h2>
                  <div className="rvt-card__content [ rvt-flow ]">
                    {block.sections.map((section, sectionIndex) => (
                      <div key={sectionIndex}>
                        <h2 className="rvt-text-medium ">{section.title}</h2>
                        <ul className="rvt-list-plain">
                          {section.items.map((item, itemIndex) => (
                            <li key={itemIndex}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <br />
        </section>
      </div>
    </main>
  );
}
