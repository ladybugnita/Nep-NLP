"""A curated list of common Nepali stopwords (function words carrying little topic signal).

This is intentionally hand-maintained and documented rather than pulled from an opaque
package, so the choices are transparent and can be tuned for each task. Removing stopwords
helps the classical TF-IDF baseline; transformer models generally keep them.
"""

NEPALI_STOPWORDS: frozenset[str] = frozenset(
    {
        # pronouns
        "म", "मलाई", "मेरो", "हामी", "हाम्रो", "हामीलाई", "तिमी", "तिम्रो", "तपाईं",
        "तपाईंको", "उ", "उनी", "उनको", "उनले", "यो", "यी", "त्यो", "ती", "यसको",
        "त्यसको", "आफ्नो", "आफू", "आफैं", "उहाँ", "यिनी", "तिनी", "जो", "जुन", "के",
        # postpositions / particles
        "को", "का", "की", "मा", "बाट", "लाई", "ले", "सँग", "संग", "सम्म", "देखि",
        "तिर", "पछि", "अघि", "माथि", "मुनि", "बिच", "बीच", "नै", "पनि", "त", "र",
        "अनि", "तर", "या", "वा", "कि", "भने", "भनेर", "भनी", "हो", "होइन", "छ",
        "छन्", "छैन", "थियो", "थिए", "हुन्", "हुन", "गर्न", "गरी", "गर्ने", "गरेको",
        "भएको", "हुने", "भए", "गर्दा", "हुँदा",
        # quantifiers / adverbs
        "सबै", "केही", "धेरै", "थोरै", "अलि", "एक", "एउटा", "दुई", "अरु", "अरू",
        "यहाँ", "त्यहाँ", "कहाँ", "अहिले", "तब", "जब", "फेरि", "मात्र", "जस्तो",
        "जस्तै", "अझै", "पहिले", "साथै", "बरु", "अथवा", "किनभने", "त्यसैले",
        "यसरी", "त्यसरी", "यसै", "त्यसै",
    }
)

__all__ = ["NEPALI_STOPWORDS"]
