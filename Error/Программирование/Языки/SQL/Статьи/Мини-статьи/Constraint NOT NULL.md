- запрещает использовать null значения.

```sql
create table STUDENTS
(
    ID         number,
    NAME       varchar2(15),
    COURSE     number
        constraint STUD_COURSE_NOTNULL NOT NULL,
    FACULTY_ID integer not null,
	constraint const1 unique (course)
);

alter table STUDENTS modify (id constraint st_id_notnull not null);
```

Вернуть возможность вставлять null:
```sql
alter table STUDENTS modify (course null);
```