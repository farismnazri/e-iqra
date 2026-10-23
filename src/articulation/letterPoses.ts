// Pose values and landmarks adapted from Makhraj 3D data-huruf.js.
// Creator: ms@ebooksunnah.com — see MAKHRAJ_3D.md. Draft/unreviewed.
// Upstream keys are kept only at the anatomy boundary; no cue/effect data is fabricated.
export interface ArticulationPose {
  lidah?: { bentuk: string; istila?: number; ithbaq?: number }
  bibir?: string
  velum?: string
  epiglotis?: string
}
export interface LetterPose {
  name: string
  pose: ArticulationPose
  landmarks: number[][]
}
export const letterPoses = {
  "hamzah": {
    "name": "Hamzah (on Alif)",
    "pose": {
      "lidah": {
        "bentuk": "alif"
      }
    },
    "landmarks": [
      [
        -0.98,
        -3.75
      ]
    ]
  },
  "ba": {
    "name": "Ba",
    "pose": {
      "bibir": "rapat"
    },
    "landmarks": [
      [
        4.3,
        -0.04
      ]
    ]
  },
  "ta": {
    "name": "Ta",
    "pose": {
      "lidah": {
        "bentuk": "ujung-pangkal"
      }
    },
    "landmarks": [
      [
        3.17,
        0.68
      ]
    ]
  },
  "tsa": {
    "name": "Tha",
    "pose": {
      "lidah": {
        "bentuk": "ujung-ujung"
      }
    },
    "landmarks": [
      [
        3.47,
        -0.05
      ]
    ]
  },
  "jim": {
    "name": "Jim",
    "pose": {
      "lidah": {
        "bentuk": "tengah-sentuh"
      }
    },
    "landmarks": [
      [
        1.45,
        1.37
      ]
    ]
  },
  "ha-h": {
    "name": "Ha (pharyngeal)",
    "pose": {
      "lidah": {
        "bentuk": "faring"
      },
      "epiglotis": "dekat"
    },
    "landmarks": [
      [
        -1.32,
        -1.58
      ]
    ]
  },
  "kha": {
    "name": "Kha",
    "pose": {
      "lidah": {
        "bentuk": "tenggorokan-atas",
        "istila": 1
      }
    },
    "landmarks": [
      [
        -1.12,
        0.96
      ]
    ]
  },
  "dal": {
    "name": "Dal",
    "pose": {
      "lidah": {
        "bentuk": "ujung-pangkal"
      }
    },
    "landmarks": [
      [
        3.17,
        0.68
      ]
    ]
  },
  "dzal": {
    "name": "Dhal",
    "pose": {
      "lidah": {
        "bentuk": "ujung-ujung"
      }
    },
    "landmarks": [
      [
        3.47,
        -0.05
      ]
    ]
  },
  "ra": {
    "name": "Ra",
    "pose": {
      "lidah": {
        "bentuk": "ujung-gusi-ra"
      }
    },
    "landmarks": [
      [
        2.98,
        0.94
      ]
    ]
  },
  "zay": {
    "name": "Zay",
    "pose": {
      "lidah": {
        "bentuk": "bawah"
      }
    },
    "landmarks": [
      [
        3.24,
        -0.72
      ]
    ]
  },
  "sin": {
    "name": "Sin",
    "pose": {
      "lidah": {
        "bentuk": "bawah"
      }
    },
    "landmarks": [
      [
        3.24,
        -0.72
      ]
    ]
  },
  "syin": {
    "name": "Shin",
    "pose": {
      "lidah": {
        "bentuk": "tengah-dekat"
      }
    },
    "landmarks": [
      [
        1.42,
        1.34
      ]
    ]
  },
  "shad": {
    "name": "Sad",
    "pose": {
      "lidah": {
        "bentuk": "bawah",
        "istila": 1,
        "ithbaq": 0.8
      }
    },
    "landmarks": [
      [
        3.24,
        -0.72
      ]
    ]
  },
  "dhad": {
    "name": "Dad",
    "pose": {
      "lidah": {
        "bentuk": "dhad",
        "istila": 1
      }
    },
    "landmarks": [
      [
        1.3,
        0.62
      ]
    ]
  },
  "tha": {
    "name": "Ta (emphatic)",
    "pose": {
      "lidah": {
        "bentuk": "ujung-pangkal",
        "istila": 1,
        "ithbaq": 0.85
      }
    },
    "landmarks": [
      [
        3.17,
        0.68
      ]
    ]
  },
  "zha": {
    "name": "Za (emphatic)",
    "pose": {
      "lidah": {
        "bentuk": "ujung-ujung",
        "istila": 1,
        "ithbaq": 0.85
      }
    },
    "landmarks": [
      [
        3.47,
        -0.05
      ]
    ]
  },
  "ain": {
    "name": "Ayn",
    "pose": {
      "lidah": {
        "bentuk": "faring"
      },
      "epiglotis": "sentuh"
    },
    "landmarks": [
      [
        -1.38,
        -1.56
      ]
    ]
  },
  "ghain": {
    "name": "Ghayn",
    "pose": {
      "lidah": {
        "bentuk": "tenggorokan-atas",
        "istila": 1
      }
    },
    "landmarks": [
      [
        -1.12,
        0.96
      ]
    ]
  },
  "fa": {
    "name": "Fa",
    "pose": {
      "bibir": "fa"
    },
    "landmarks": [
      [
        3.52,
        0
      ]
    ]
  },
  "qaf": {
    "name": "Qaf",
    "pose": {
      "lidah": {
        "bentuk": "pangkal-qaf",
        "istila": 1
      }
    },
    "landmarks": [
      [
        -0.5,
        1.13
      ]
    ]
  },
  "kaf": {
    "name": "Kaf",
    "pose": {
      "lidah": {
        "bentuk": "pangkal-kaf"
      }
    },
    "landmarks": [
      [
        -0.1,
        1.22
      ]
    ]
  },
  "lam": {
    "name": "Lam",
    "pose": {
      "lidah": {
        "bentuk": "lam"
      }
    },
    "landmarks": [
      [
        3.02,
        0.9
      ]
    ]
  },
  "mim": {
    "name": "Mim",
    "pose": {
      "bibir": "rapat",
      "velum": "turun"
    },
    "landmarks": [
      [
        4.3,
        -0.04
      ]
    ]
  },
  "nun": {
    "name": "Nun",
    "pose": {
      "lidah": {
        "bentuk": "ujung-gusi-nun"
      },
      "velum": "turun"
    },
    "landmarks": [
      [
        2.97,
        0.93
      ]
    ]
  },
  "ha": {
    "name": "Ha (glottal)",
    "pose": {
      "lidah": {
        "bentuk": "alif"
      }
    },
    "landmarks": [
      [
        -0.98,
        -3.75
      ]
    ]
  },
  "wawu": {
    "name": "Waw",
    "pose": {
      "bibir": "maju",
      "lidah": {
        "bentuk": "wawu"
      }
    },
    "landmarks": [
      [
        4.66,
        0
      ]
    ]
  },
  "alif": {
    "name": "Alif (long vowel)",
    "pose": {
      "lidah": {
        "bentuk": "alif"
      }
    },
    "landmarks": []
  },
  "ya": {
    "name": "Ya",
    "pose": {
      "lidah": {
        "bentuk": "tengah-dekat"
      }
    },
    "landmarks": [
      [
        1.42,
        1.34
      ]
    ]
  }
} satisfies Record<string, LetterPose>

export type LetterId = keyof typeof letterPoses
