import vecs

print("reached here")
DB_CONNECTION = "postgresql://<user>:<password>@<host>:<port>/<db_name>"

# create vector store client
vx = vecs.create_client(DB_CONNECTION)

# create a collection of vectors with 3 dimensions
docs = vx.get_or_create_collection(name="docs", dimension=3)

# add records to the *docs* collection
docs.upsert(
    records=[
        (
         "vec0",           # the vector's identifier
         [0.1, 0.2, 0.3],  # the vector. list or np.array
         {"year": 1973}    # associated  metadata
        ),
        (
         "vec1",
         [0.7, 0.8, 0.9],
         {"year": 2012}
        )
    ]
)

# index the collection for fast search performance
docs.create_index()

# query the collection filtering metadata for "year" = 2012
docs.query(
    data=[0.4,0.5,0.6],              # required
    limit=1,                         # number of records to return
    filters={"year": {"$eq": 2012}}, # metadata filters
)

# Returns: ["vec1"]