# SeeOnce

Automatic client-based forward-secrecy encryption for email

SeeOnce is essentially a subset of [PassLok](https://github.com/fruiz500/passlok), also available on GitHub, including the forward secrecy encryption modes, selected automatically according to context, plus one text steganography algorithm. It is designed for extreme simplicity, so that users are spared having to worry about key management while involving no servers, and without sacrificing security.

These are the principles guiding the design of SeeOnce:
* Perfect portability. Runs on any computer or mobile device.
* Completely self-contained so it runs offline. No servers.
* Everything saved locally is encrypted. Easy to move to another machine.
* Key management is automated. Users never handle public keys.
* Easy to understand and use by novices. Single-page graphical interface. No crypto jargon.

Because of this, SeeOnce is pure html code consisting mostly of JavaScript instructions. Its cryptography code is based on Tweet NaCl, also on GitHub. It uses XSalsa20 for symmetric encryption and the Curve25519 elliptic curve for public-key functions.

These are the open source libraries used in SeeOnce, which can be found in the js-opensrc directory:
* Tweet NaCl in JavaScript: https://github.com/dchest/tweetnacl-js
* SCRYPT key stretching, edited to make it synchronous. https://github.com/dchest/scrypt-async-js
* lz-string compression algorithm: https://github.com/pieroxy/lz-string
* FastClick, used only in mobile devices: https://github.com/ftlabs/fastclick

The SeeOnce original code is in directories js-head and js-body (note: names are the same as their PassLok equivalents, but they are different libraries):
* this only loads two word arrays: wordlist and blacklist: dictionary_en.js
* Key and Lock functions: KeyLock.js
* cryptographic functions: crypto.js
* extra functions for mail, etc.: extra.js
* local Directory functions: localDir.js
* functions for switching screens, etc.: switching.js
* text steganograghy: stego.js
* special functions that work only with Chrome apps and extensions: Chromestuff.js
* window reformatting, special functions: bodyscript.js
* initialization, button connections: initbuttons.js

Full documentation to be found at: <http://see-once.weebly.com/> including:
* SeeOnce technical design document: https://seeonce.net/seeonce_technical_document.pdf
* and a number of articles and video tutorials, coming soon.

License
-------

  Copyright (C) 2016 Francisco Ruiz

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program. If not, see <http://www.gnu.org/licenses/>.

Acknowledgements
----------------

  SeeOnce contains and/or links to code from a number of open source
  projects on GitHub, including the Tweet NaCl crypto library, and others.

Cryptography Notice
-------------------

  This distribution includes cryptographic software. The country in
  which you currently reside may have restrictions on the import,
  possession, use, and/or re-export to another country, of encryption
  software. BEFORE using any encryption software, please check your
  country's laws, regulations and policies concerning the import,
  possession, or use, and re-export of encryption software, to see if
  this is permitted. See <http://www.wassenaar.org/> for more
  information.

  The U.S. Government Department of Commerce, Bureau of Industry and
  Security (BIS), has classified this software as Export Commodity
  Control Number (ECCN) 5D002.C.1, which includes information security
  software using or performing cryptographic functions with asymmetric
  algorithms. The form and manner of this distribution makes it
  eligible for export under the License Exception ENC Technology
  Software Unrestricted (TSU) exception (see the BIS Export
  Administration Regulations, Section 740.13) for both object code and
  source code.

